import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import EventSource from "react-native-sse";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type UserBirthInfo = {
  id: string;
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
  birthLocation?: string;
  favorableElements?: string[];
  unfavorableElements?: string[];
  baziResult?: {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
    dayMaster: string;
  };
  fiveElements?: Record<string, number>;
};

type OutfitRecommendation = {
  styleSuggestion?: string;
  materialSuggestion?: string;
  primaryDesc?: string;
  secondaryDesc?: string;
  avoidDesc?: string;
  outfits?: Array<{ title: string; desc: string }>;
};

type DailyFortune = {
  totalScore?: number;
  totalLabel?: string;
  mainTip?: string;
  luckyColor?: { name: string; hex: string };
  luckyNumber?: number;
};

type BraceletRecommendation = {
  matchingPrinciple?: string;
  primaryBracelet?: {
    name: string;
    material: string;
    effect: string;
  };
};

type MingpanAnalysis = {
  fortune?: {
    career?: { score?: number; desc?: string };
    wealth?: { score?: number; desc?: string };
    love?: { score?: number; desc?: string };
    health?: { score?: number; desc?: string };
  };
  pattern?: {
    name?: string;
    description?: string;
  };
  bodyStrengthText?: string;
  fiveElements?: Record<string, number>;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const USER_ID = "user_default";
const MAX_CHAT_CONTEXT = 8;
const CACHE_KEYS = {
  RECORDS: "bazi_mobile_records",
  LAST_DETAIL: "bazi_mobile_last_detail",
  CHAT: "bazi_mobile_chat_history",
};

function resolveApiBase() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  const hostUri = (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host) {
    return `http://${host}:3001/api`;
  }
  return "http://127.0.0.1:3001/api";
}

async function fetchJson(path: string, init?: RequestInit, retry = 1, apiBase = resolveApiBase()) {
  try {
    const res = await fetch(`${apiBase}${path}`, init);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? `请求失败: ${res.status}`);
    }
    return data;
  } catch (e) {
    if (retry > 0) return fetchJson(path, init, retry - 1, apiBase);
    throw e;
  }
}

function toBase64Utf8(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }
  const g = globalThis as unknown as { Buffer?: { from: (v: string, enc: string) => { toString: (e: string) => string } } };
  return g.Buffer ? g.Buffer.from(binary, "binary").toString("base64") : "";
}

export default function App() {
  const apiBase = useMemo(() => resolveApiBase(), []);
  const [activeTab, setActiveTab] = useState<"home" | "analysis" | "ai">("home");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<UserBirthInfo[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<UserBirthInfo | null>(null);
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null);
  const [bracelet, setBracelet] = useState<BraceletRecommendation | null>(null);
  const [dailyFortune, setDailyFortune] = useState<DailyFortune | null>(null);
  const [mingpan, setMingpan] = useState<MingpanAnalysis | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [lastFailedUserMessage, setLastFailedUserMessage] = useState<string | null>(null);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [typingDots, setTypingDots] = useState(".");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "你好，我是你的命理助手。你可以问我流年、事业、感情或健康问题。" },
  ]);
  const [form, setForm] = useState({
    name: "",
    birthYear: new Date().getFullYear() - 25,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12,
    gender: "male" as "male" | "female",
    calendarType: "solar" as "solar" | "lunar",
    birthLocation: "",
  });

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => now - i);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const byGender = genderFilter === "all" ? true : r.gender === genderFilter;
      const keyword = searchKeyword.trim().toLowerCase();
      const byKeyword =
        !keyword ||
        (r.name || "").toLowerCase().includes(keyword) ||
        `${r.birthYear}${r.birthMonth}${r.birthDay}`.includes(keyword);
      return byGender && byKeyword;
    });
  }, [records, searchKeyword, genderFilter]);

  const saveChatCache = async (messages: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.CHAT, JSON.stringify(messages.slice(-20)));
    } catch {}
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchJson(`/users/${USER_ID}/birth-info`, undefined, 1, apiBase);
      const items = (data.items ?? []) as UserBirthInfo[];
      setRecords(items);
      await AsyncStorage.setItem(CACHE_KEYS.RECORDS, JSON.stringify(items));
      if (items.length > 0) {
        await loadRecord(items[0].id);
      }
    } catch (e) {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.RECORDS);
      if (cached) {
        setRecords(JSON.parse(cached) as UserBirthInfo[]);
        Alert.alert("离线模式", "已加载本地缓存记录。");
      } else {
        Alert.alert("加载失败", "无法获取生辰记录，请确认后端可访问。");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRecord = async (id: string) => {
    setLoading(true);
    try {
      setSelectedId(id);
      const [info, outfitData, braceletData, dailyData, mingpanData] = await Promise.all([
        fetchJson(`/users/${USER_ID}/birth-info/${id}`, undefined, 1, apiBase),
        fetchJson(`/users/${USER_ID}/outfit-recommendation?recordId=${id}`, undefined, 1, apiBase),
        fetchJson(`/users/${USER_ID}/bracelet-recommendation?recordId=${id}`, undefined, 1, apiBase),
        fetchJson(`/users/${USER_ID}/daily-fortune?recordId=${id}`, undefined, 1, apiBase),
        fetchJson(`/users/${USER_ID}/mingpan-analysis?recordId=${id}`, undefined, 1, apiBase),
      ]);
      setSelectedRecord(info);
      setOutfit(outfitData);
      setBracelet(braceletData);
      setDailyFortune(dailyData);
      setMingpan(mingpanData);
      await AsyncStorage.setItem(
        CACHE_KEYS.LAST_DETAIL,
        JSON.stringify({
          selectedId: id,
          selectedRecord: info,
          outfit: outfitData,
          bracelet: braceletData,
          dailyFortune: dailyData,
          mingpan: mingpanData,
        })
      );
    } catch {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.LAST_DETAIL);
      if (cached) {
        const detail = JSON.parse(cached) as {
          selectedId: string;
          selectedRecord: UserBirthInfo;
          outfit: OutfitRecommendation;
          bracelet: BraceletRecommendation;
          dailyFortune: DailyFortune;
          mingpan: MingpanAnalysis;
        };
        setSelectedId(detail.selectedId);
        setSelectedRecord(detail.selectedRecord);
        setOutfit(detail.outfit);
        setBracelet(detail.bracelet);
        setDailyFortune(detail.dailyFortune);
        setMingpan(detail.mingpan);
        Alert.alert("离线模式", "详情加载失败，已使用最近一次缓存。");
      } else {
        Alert.alert("加载失败", "记录详情获取失败。");
      }
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async () => {
    setLoading(true);
    try {
      const path = editingId ? `/users/${USER_ID}/birth-info/${editingId}` : `/users/${USER_ID}/birth-info`;
      const method = editingId ? "PATCH" : "POST";
      const data = await fetchJson(
        path,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
        1,
        apiBase
      );
      Alert.alert("成功", editingId ? "生辰信息已更新" : "生辰信息已保存");
      setEditingId(null);
      setForm((prev) => ({ ...prev, name: "", birthLocation: "" }));
      await fetchRecords();
      if (data.id) {
        await loadRecord(data.id);
      }
    } catch (e: any) {
      Alert.alert("保存失败", e?.message ?? "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const startEditRecord = () => {
    if (!selectedRecord) return;
    setEditingId(selectedRecord.id);
    setForm({
      name: selectedRecord.name ?? "",
      birthYear: selectedRecord.birthYear,
      birthMonth: selectedRecord.birthMonth,
      birthDay: selectedRecord.birthDay,
      birthHour: selectedRecord.birthHour,
      gender: selectedRecord.gender,
      calendarType: selectedRecord.calendarType,
      birthLocation: selectedRecord.birthLocation ?? "",
    });
    setActiveTab("home");
  };

  const deleteRecord = (id: string) => {
    Alert.alert("确认删除", "删除后无法恢复，是否继续？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await fetchJson(
              `/users/${USER_ID}/birth-info/${id}`,
              { method: "DELETE" },
              1,
              apiBase
            );
            if (selectedId === id) {
              setSelectedId("");
              setSelectedRecord(null);
            }
            await fetchRecords();
          } catch (e: any) {
            Alert.alert("删除失败", e?.message ?? "未知错误");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    (async () => {
      try {
        const chatCache = await AsyncStorage.getItem(CACHE_KEYS.CHAT);
        if (chatCache) {
          const parsed = JSON.parse(chatCache) as ChatMessage[];
          if (parsed.length > 0) setChatMessages(parsed);
        }
      } catch {}
    })();
    fetchRecords();
  }, [apiBase]);

  useEffect(() => {
    if (!aiStreaming) {
      setTypingDots(".");
      return;
    }
    const timer = setInterval(() => {
      setTypingDots((prev) => (prev.length >= 3 ? "." : `${prev}.`));
    }, 350);
    return () => clearInterval(timer);
  }, [aiStreaming]);

  const sendAiMessage = async (overrideMessage?: string) => {
    const userText = (overrideMessage ?? chatInput).trim();
    if (!userText) return;
    if (!selectedId) {
      Alert.alert("提示", "请先创建或选择一个档案。");
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: userText };
    const contextMessages = chatMessages.slice(-MAX_CHAT_CONTEXT);
    const nextMessages = [...contextMessages, userMsg];
    setChatMessages(nextMessages);
    saveChatCache(nextMessages);
    setChatInput("");
    setLoading(true);
    setLastFailedUserMessage(null);
    setAiStreaming(true);

    try {
      const encoded = toBase64Utf8(JSON.stringify(nextMessages.map((m) => ({ role: m.role, content: m.content }))));
      const query = `userId=${encodeURIComponent(USER_ID)}&recordId=${encodeURIComponent(selectedId)}&messages=${encodeURIComponent(encoded)}`;
      const streamUrl = `${apiBase}/ai/chat/stream?${query}`;
      let streamText = "";

      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      await new Promise<void>((resolve, reject) => {
        const es = new EventSource(streamUrl, {
          headers: {
            Accept: "text/event-stream",
          },
        });

        es.addEventListener("token", (event: { data?: string }) => {
          try {
            const token = JSON.parse(event.data || "{}")?.token || "";
            if (!token) return;
            streamText += token;
            setChatMessages((prev) => {
              const cloned = [...prev];
              const last = cloned[cloned.length - 1];
              if (last?.role === "assistant") {
                cloned[cloned.length - 1] = { ...last, content: streamText };
              }
              return cloned;
            });
          } catch {}
        });

        es.addEventListener("done", () => {
          es.close();
          saveChatCache([...nextMessages, { role: "assistant", content: streamText || "暂无回复" }]);
          setAiStreaming(false);
          resolve();
        });

        es.addEventListener("error", (event: { data?: string }) => {
          es.close();
          setAiStreaming(false);
          try {
            const errMsg = JSON.parse(event.data || "{}")?.message || "流式连接失败";
            reject(new Error(errMsg));
          } catch {
            reject(new Error("流式连接失败"));
          }
        });
      });
    } catch (e: any) {
      try {
        const data = await fetchJson(
          `/ai/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: USER_ID,
              recordId: selectedId,
              messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            }),
          },
          1,
          apiBase
        );
        const fallback = [...nextMessages, { role: "assistant" as const, content: data.message ?? "暂无回复" }];
        setChatMessages(fallback);
        saveChatCache(fallback);
        setAiStreaming(false);
      } catch (fallbackErr: any) {
        setLastFailedUserMessage(userText);
        const failed = [
          ...nextMessages,
          { role: "assistant" as const, content: `抱歉，当前无法回复：${fallbackErr?.message ?? e?.message ?? "未知错误"}` },
        ];
        setChatMessages(failed);
        saveChatCache(failed);
        setAiStreaming(false);
      }
    } finally {
      setLoading(false);
      setAiStreaming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.tabBar}>
        <TabButton title="首页" active={activeTab === "home"} onPress={() => setActiveTab("home")} />
        <TabButton title="命盘" active={activeTab === "analysis"} onPress={() => setActiveTab("analysis")} />
        <TabButton title="AI 命理" active={activeTab === "ai"} onPress={() => setActiveTab("ai")} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>五行色彩搭配（移动版）</Text>
        <Text style={styles.subtitle}>API: {apiBase}</Text>

        {activeTab === "home" && (
          <>
        <Card title="录入生辰">
          <LabeledInput
            label="姓名"
            value={form.name}
            onChangeText={(v) => setForm((s) => ({ ...s, name: v }))}
            placeholder="例如：小明"
          />
          <LabeledInput
            label="出生地（可选）"
            value={form.birthLocation}
            onChangeText={(v) => setForm((s) => ({ ...s, birthLocation: v }))}
            placeholder="例如：北京"
          />
          <NumberChooser
            label="出生年"
            value={form.birthYear}
            values={years}
            onChange={(v) => setForm((s) => ({ ...s, birthYear: v }))}
          />
          <NumberChooser
            label="出生月"
            value={form.birthMonth}
            values={Array.from({ length: 12 }, (_, i) => i + 1)}
            onChange={(v) => setForm((s) => ({ ...s, birthMonth: v }))}
          />
          <NumberChooser
            label="出生日"
            value={form.birthDay}
            values={Array.from({ length: 31 }, (_, i) => i + 1)}
            onChange={(v) => setForm((s) => ({ ...s, birthDay: v }))}
          />
          <NumberChooser
            label="出生时"
            value={form.birthHour}
            values={Array.from({ length: 24 }, (_, i) => i)}
            onChange={(v) => setForm((s) => ({ ...s, birthHour: v }))}
          />
          <SwitchGroup
            label="性别"
            value={form.gender}
            options={[
              { label: "男", value: "male" },
              { label: "女", value: "female" },
            ]}
            onChange={(v) => setForm((s) => ({ ...s, gender: v as "male" | "female" }))}
          />
          <View style={styles.rowActions}>
            <Pressable style={styles.primaryBtnInline} onPress={createRecord}>
              <Text style={styles.primaryBtnText}>{editingId ? "更新档案" : "保存并分析"}</Text>
            </Pressable>
            {editingId && (
              <Pressable
                style={styles.secondaryBtnInline}
                onPress={() => {
                  setEditingId(null);
                  setForm((prev) => ({ ...prev, name: "", birthLocation: "" }));
                }}
              >
                <Text style={styles.secondaryBtnText}>取消编辑</Text>
              </Pressable>
            )}
          </View>
        </Card>

        <Card title="我的档案">
          <LabeledInput
            label="搜索"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            placeholder="按姓名或生日关键字搜索"
          />
          <SwitchGroup
            label="性别筛选"
            value={genderFilter}
            options={[
              { label: "全部", value: "all" },
              { label: "男", value: "male" },
              { label: "女", value: "female" },
            ]}
            onChange={(v) => setGenderFilter(v as "all" | "male" | "female")}
          />
          {records.length === 0 && <Text style={styles.muted}>暂无记录</Text>}
          {filteredRecords.map((r) => (
            <View key={r.id} style={[styles.itemRow, selectedId === r.id && styles.itemRowActive]}>
              <Pressable onPress={() => loadRecord(r.id)}>
                <Text style={styles.itemTitle}>{r.name || "未命名"}</Text>
                <Text style={styles.itemMeta}>
                  {r.birthYear}-{String(r.birthMonth).padStart(2, "0")}-
                  {String(r.birthDay).padStart(2, "0")} {r.birthHour}:00
                </Text>
              </Pressable>
              <View style={styles.itemActionRow}>
                <Pressable style={styles.tinyBtn} onPress={() => loadRecord(r.id).then(startEditRecord)}>
                  <Text style={styles.tinyBtnText}>编辑</Text>
                </Pressable>
                <Pressable style={[styles.tinyBtn, styles.tinyBtnDanger]} onPress={() => deleteRecord(r.id)}>
                  <Text style={[styles.tinyBtnText, styles.tinyBtnDangerText]}>删除</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {records.length > 0 && filteredRecords.length === 0 && <Text style={styles.muted}>没有匹配结果</Text>}
        </Card>

        {selectedRecord && (
          <Card title="八字信息">
            <Text style={styles.blockText}>
              四柱：{selectedRecord.baziResult?.yearPillar} {selectedRecord.baziResult?.monthPillar}{" "}
              {selectedRecord.baziResult?.dayPillar} {selectedRecord.baziResult?.hourPillar}
            </Text>
            <Text style={styles.blockText}>日主：{selectedRecord.baziResult?.dayMaster ?? "-"}</Text>
            <Text style={styles.blockText}>
              喜用：{(selectedRecord.favorableElements ?? []).join("、") || "-"}
            </Text>
            <Text style={styles.blockText}>
              忌用：{(selectedRecord.unfavorableElements ?? []).join("、") || "-"}
            </Text>
          </Card>
        )}

        {outfit && (
          <Card title="今日穿搭建议">
            <Text style={styles.blockText}>主色建议：{outfit.primaryDesc ?? "-"}</Text>
            <Text style={styles.blockText}>辅助色：{outfit.secondaryDesc ?? "-"}</Text>
            <Text style={styles.blockText}>避开色：{outfit.avoidDesc ?? "-"}</Text>
            <Text style={styles.blockText}>风格：{outfit.styleSuggestion ?? "-"}</Text>
          </Card>
        )}

        {bracelet && (
          <Card title="手串建议">
            <Text style={styles.blockText}>原则：{bracelet.matchingPrinciple ?? "-"}</Text>
            <Text style={styles.blockText}>首选：{bracelet.primaryBracelet?.name ?? "-"}</Text>
            <Text style={styles.blockText}>材质：{bracelet.primaryBracelet?.material ?? "-"}</Text>
            <Text style={styles.blockText}>作用：{bracelet.primaryBracelet?.effect ?? "-"}</Text>
          </Card>
        )}
        {selectedRecord && (
          <Pressable style={styles.primaryBtn} onPress={startEditRecord}>
            <Text style={styles.primaryBtnText}>编辑当前档案</Text>
          </Pressable>
        )}
          </>
        )}

        {activeTab === "analysis" && (
          <>
            <Card title="今日运势">
              <Text style={styles.blockText}>综合：{dailyFortune?.totalLabel ?? "-"}（{dailyFortune?.totalScore ?? "-"}）</Text>
              <Text style={styles.blockText}>提示：{dailyFortune?.mainTip ?? "-"}</Text>
              <Text style={styles.blockText}>
                幸运色：{dailyFortune?.luckyColor?.name ?? "-"} {dailyFortune?.luckyColor?.hex ?? ""}
              </Text>
              <Text style={styles.blockText}>幸运数字：{dailyFortune?.luckyNumber ?? "-"}</Text>
            </Card>
            <Card title="命盘综合分析">
              <Text style={styles.blockText}>身强弱：{mingpan?.bodyStrengthText ?? "-"}</Text>
              <Text style={styles.blockText}>命格：{mingpan?.pattern?.name ?? "-"}</Text>
              <Text style={styles.blockText}>命格说明：{mingpan?.pattern?.description ?? "-"}</Text>
              <Text style={styles.blockText}>事业分：{mingpan?.fortune?.career?.score ?? "-"}</Text>
              <Text style={styles.blockText}>财运分：{mingpan?.fortune?.wealth?.score ?? "-"}</Text>
              <Text style={styles.blockText}>感情分：{mingpan?.fortune?.love?.score ?? "-"}</Text>
              <Text style={styles.blockText}>健康分：{mingpan?.fortune?.health?.score ?? "-"}</Text>
            </Card>
            <Card title="运势可视化">
              <ScoreBar label="事业" value={mingpan?.fortune?.career?.score ?? 0} color="#ff6b9d" />
              <ScoreBar label="财运" value={mingpan?.fortune?.wealth?.score ?? 0} color="#ffa24d" />
              <ScoreBar label="感情" value={mingpan?.fortune?.love?.score ?? 0} color="#7c8dff" />
              <ScoreBar label="健康" value={mingpan?.fortune?.health?.score ?? 0} color="#30c38d" />
            </Card>
            <Card title="五行可视化">
              {(["wood", "fire", "earth", "metal", "water"] as const).map((el) => (
                <ScoreBar
                  key={el}
                  label={el}
                  value={Number(mingpan?.fiveElements?.[el] ?? selectedRecord?.fiveElements?.[el] ?? 0) * 20}
                  color="#5a74ff"
                />
              ))}
            </Card>
          </>
        )}

        {activeTab === "ai" && (
          <>
            <Card title="AI 命理对话">
              <Text style={styles.muted}>已自动携带当前档案八字信息，可直接提问。</Text>
              <View style={styles.chatBox}>
                {chatMessages.map((m, i) => (
                  <View
                    key={`${m.role}-${i}`}
                    style={[styles.msgBubble, m.role === "user" ? styles.userBubble : styles.assistantBubble]}
                  >
                    <Text style={styles.msgRole}>{m.role === "user" ? "我" : "AI"}</Text>
                    <Text style={styles.msgText}>{m.content}</Text>
                  </View>
                ))}
                {aiStreaming && (
                  <View style={[styles.msgBubble, styles.assistantBubble, styles.typingBubble]}>
                    <Text style={styles.msgRole}>AI</Text>
                    <Text style={styles.typingText}>正在思考{typingDots}</Text>
                  </View>
                )}
              </View>
              <TextInput
                style={styles.input}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="输入你的问题，例如：我今年事业如何？"
              />
              <Pressable style={styles.primaryBtn} onPress={sendAiMessage}>
                <Text style={styles.primaryBtnText}>发送</Text>
              </Pressable>
              {lastFailedUserMessage && (
                <Pressable style={styles.secondaryBtnInline} onPress={() => sendAiMessage(lastFailedUserMessage)}>
                  <Text style={styles.secondaryBtnText}>重试上一条</Text>
                </Pressable>
              )}
            </Card>
          </>
        )}
      </ScrollView>

      {loading && (
        <View style={styles.loadingMask}>
          <ActivityIndicator size="large" color="#ff6b9d" />
        </View>
      )}
    </SafeAreaView>
  );
}

function TabButton(props: { title: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabBtn, props.active && styles.tabBtnActive]} onPress={props.onPress}>
      <Text style={[styles.tabText, props.active && styles.tabTextActive]}>{props.title}</Text>
    </Pressable>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ScoreBar(props: { label: string; value: number; color: string }) {
  const safe = Math.max(0, Math.min(100, props.value || 0));
  const mark =
    safe >= 80 ? "A" : safe >= 60 ? "B" : safe >= 40 ? "C" : "D";
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>{props.label}</Text>
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: `${safe}%`, backgroundColor: props.color }]}>
          <View style={styles.scoreShine} />
        </View>
      </View>
      <Text style={styles.scoreValue}>{safe}</Text>
      <Text style={styles.scoreGrade}>{mark}</Text>
    </View>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
      />
    </View>
  );
}

function NumberChooser(props: {
  label: string;
  value: number;
  values: number[];
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipsRow}>
          {props.values.map((v) => (
            <Pressable
              key={v}
              style={[styles.chip, props.value === v && styles.chipActive]}
              onPress={() => props.onChange(v)}
            >
              <Text style={[styles.chipText, props.value === v && styles.chipTextActive]}>
                {props.label === "出生时" ? `${v}:00` : v}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SwitchGroup(props: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.switchRow}>
        {props.options.map((o) => (
          <Pressable
            key={o.value}
            style={[styles.switchBtn, props.value === o.value && styles.switchBtnActive]}
            onPress={() => props.onChange(o.value)}
          >
            <Text style={[styles.switchText, props.value === o.value && styles.switchTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fc" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eceff8",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#f3f5fa",
  },
  tabBtnActive: {
    backgroundColor: "#ffedf3",
    borderWidth: 1,
    borderColor: "#ff6b9d",
  },
  tabText: { color: "#5d647a", fontWeight: "600" },
  tabTextActive: { color: "#ff3b80" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#1a1a2e" },
  subtitle: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eceff8",
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a2e" },
  field: { gap: 6 },
  label: { fontSize: 13, color: "#495066", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d8dce8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  chipsRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d6d9e6",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#ffedf3", borderColor: "#ff6b9d" },
  chipText: { fontSize: 12, color: "#4b5563" },
  chipTextActive: { color: "#ff3b80", fontWeight: "700" },
  switchRow: { flexDirection: "row", gap: 8 },
  switchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d6d9e6",
  },
  switchBtnActive: { backgroundColor: "#ffedf3", borderColor: "#ff6b9d" },
  switchText: { color: "#4b5563" },
  switchTextActive: { color: "#ff3b80", fontWeight: "700" },
  primaryBtn: {
    marginTop: 4,
    backgroundColor: "#ff6b9d",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  rowActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  primaryBtnInline: {
    flex: 1,
    backgroundColor: "#ff6b9d",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnInline: {
    marginTop: 8,
    backgroundColor: "#eef1fb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtnText: { color: "#45506b", fontWeight: "700" },
  muted: { color: "#6b7280" },
  itemRow: {
    borderWidth: 1,
    borderColor: "#eceff8",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  itemRowActive: { borderColor: "#ff6b9d", backgroundColor: "#fff3f7" },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  itemMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  itemActionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  tinyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f3f5fa",
  },
  tinyBtnDanger: { backgroundColor: "#ffeef1" },
  tinyBtnText: { color: "#4b5563", fontWeight: "600", fontSize: 12 },
  tinyBtnDangerText: { color: "#cc305f" },
  blockText: { fontSize: 14, lineHeight: 20, color: "#30354b" },
  scoreItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  scoreLabel: { width: 42, color: "#4c556f", fontSize: 13 },
  scoreTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "#eef1f8",
    borderRadius: 999,
    overflow: "hidden",
  },
  scoreFill: { height: 10, borderRadius: 999 },
  scoreShine: { height: 4, marginTop: 1, marginHorizontal: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.45)" },
  scoreValue: { width: 30, textAlign: "right", color: "#4c556f", fontSize: 12 },
  scoreGrade: { width: 18, textAlign: "right", color: "#4c556f", fontSize: 11, fontWeight: "700" },
  chatBox: { gap: 8, marginTop: 10, marginBottom: 8 },
  msgBubble: { borderRadius: 10, padding: 10, borderWidth: 1 },
  userBubble: { backgroundColor: "#fff3f7", borderColor: "#ffd2e3" },
  assistantBubble: { backgroundColor: "#f8f9ff", borderColor: "#e3e7ff" },
  typingBubble: { opacity: 0.9 },
  msgRole: { fontSize: 12, fontWeight: "700", marginBottom: 4, color: "#566" },
  msgText: { fontSize: 14, lineHeight: 20, color: "#1f2440" },
  typingText: { fontSize: 14, lineHeight: 20, color: "#42506b", fontStyle: "italic" },
  loadingMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
