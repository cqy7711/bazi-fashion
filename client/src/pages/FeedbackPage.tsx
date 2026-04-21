import { useState } from 'react';

export default function FeedbackPage() {
  // 保存输入框中的反馈内容，默认值为空字符串。
  const [feedbackText, setFeedbackText] = useState('');

  // 保存提交后的状态提示，用于向用户反馈提交结果。
  const [submitMessage, setSubmitMessage] = useState('');

  // 处理反馈提交事件，当前先做前端提示，后续可接入后端接口。
  const handleSubmit = () => {
    // 如果用户没有填写内容，直接提示并阻止“空提交”。
    if (!feedbackText.trim()) {
      setSubmitMessage('请先填写反馈内容后再提交。');
      return;
    }

    // 临时反馈提示：当前版本先展示成功信息，便于快速上线反馈入口。
    setSubmitMessage('感谢你的反馈！我们会尽快查看并优化。');

    // 提交后清空输入框，方便用户继续提交新的建议。
    setFeedbackText('');
  };

  return (
    <section
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '12px 0 6px',
      }}
    >
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#2f2a3d',
          marginBottom: '8px',
        }}
      >
        反馈建议
      </h1>

      <p
        style={{
          color: '#6e667f',
          lineHeight: 1.7,
          marginBottom: '16px',
        }}
      >
        欢迎告诉我们你在使用过程中的问题或建议，你的反馈会帮助我们持续改进。
      </p>

      <textarea
        value={feedbackText}
        onChange={(event) => {
          // 监听输入内容变化，并实时同步到状态。
          setFeedbackText(event.target.value);
        }}
        placeholder="请输入你的反馈内容..."
        rows={7}
        style={{
          width: '100%',
          borderRadius: '14px',
          border: '1px solid rgba(137, 128, 161, 0.25)',
          background: 'rgba(255,255,255,0.92)',
          padding: '14px 16px',
          fontSize: '0.95rem',
          color: '#2f2a3d',
          outline: 'none',
          resize: 'vertical',
          boxShadow: '0 8px 20px rgba(75, 61, 103, 0.06)',
        }}
      />

      <button
        type="button"
        onClick={handleSubmit}
        style={{
          marginTop: '12px',
          border: 'none',
          borderRadius: '12px',
          padding: '10px 18px',
          color: '#fff',
          background: 'linear-gradient(135deg, #7f8df8, #a678f6)',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 10px 20px rgba(127, 141, 248, 0.28)',
        }}
      >
        提交反馈
      </button>

      {submitMessage ? (
        <p
          style={{
            marginTop: '10px',
            color: '#5b4d78',
            fontSize: '0.9rem',
          }}
        >
          {submitMessage}
        </p>
      ) : null}
    </section>
  );
}
