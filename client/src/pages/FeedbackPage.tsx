import { useState } from 'react';

export default function FeedbackPage() {
  const [feedbackText, setFeedbackText] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const feedbackEmail = String((import.meta as any)?.env?.VITE_FEEDBACK_EMAIL || '').trim();

  const handleSubmit = () => {
    if (!feedbackText.trim()) {
      setSubmitMessage('请先填写反馈内容后再提交。');
      return;
    }

    if (!feedbackEmail) {
      setSubmitMessage('反馈邮箱未配置，请先在环境变量中设置 VITE_FEEDBACK_EMAIL。');
      return;
    }

    const subject = encodeURIComponent('五行色彩搭配 - 用户反馈');
    const body = encodeURIComponent(
      [
        feedbackText.trim(),
        '',
        '---',
        `Page: ${window.location.href}`,
        `UA: ${navigator.userAgent}`,
        `Time: ${new Date().toISOString()}`,
      ].join('\n'),
    );
    window.location.href = `mailto:${feedbackEmail}?subject=${subject}&body=${body}`;
    setSubmitMessage(`已打开邮箱客户端，收件人：${feedbackEmail}`);
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
          marginBottom: '8px',
        }}
      >
        欢迎告诉我们你在使用过程中的问题或建议，你的反馈会帮助我们持续改进。
      </p>
      <p
        style={{
          color: '#6e667f',
          fontSize: '0.88rem',
          marginBottom: '16px',
        }}
      >
        反馈邮箱：{feedbackEmail || '未配置（请设置 VITE_FEEDBACK_EMAIL）'}
      </p>

      <textarea
        value={feedbackText}
        onChange={(event) => {
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
        发送到邮箱
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
