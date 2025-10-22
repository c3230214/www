import re
import streamlit as st
from openai import OpenAI, BadRequestError

st.set_page_config(page_title="GPT Web検索チャット", page_icon="🔎")
st.title("🔎 GPT Web検索チャット（Streaming / Reasoning=High）")

# --- 会話ログと直近の全文 ---
if "messages" not in st.session_state:
    st.session_state.messages = []
if "_last_full_text" not in st.session_state:
    st.session_state._last_full_text = ""

# --- サイドバー：設定＆出典 ---
with st.sidebar:
    st.header("設定")
    model = st.selectbox(
        "モデル（Responses API対応）",
        [
            "gpt-4o",        # 安定: web_searchツール＆ストリーミングに対応
            "gpt-4o-mini",   # 軽量
            "gpt-5",         # 利用権限がある場合のみ（非対応なら gpt-4o 推奨）
        ],
        index=0,
        help="*注意*: “-search-preview”系は Chat Completions 向けの記述があり、Responses API＋web_searchと相性が悪いケースがあります。"
    )
    enable_search = st.toggle("ウェブ検索を許可（tools=web_search）", value=True)
    st.caption("モデルが対応していれば、必要に応じてWeb検索が自動で使われます。")

    st.markdown("---")
    st.header("出典（自動抽出）")

    def render_sources(md_text: str):
        # [title](url) を優先抽出
        links = re.findall(r"\[([^\]]+)\]\((https?://[^\s)]+)\)", md_text)
        urls = re.findall(r"(?<!\()(?P<url>https?://[^\s\)]+)", md_text)
        seen = set()
        for title, url in links:
            if url in seen: 
                continue
            st.markdown(f"- [{title}]({url})")
            seen.add(url)
        for url in urls:
            if url not in seen:
                st.markdown(f"- <{url}>")
                seen.add(url)

    render_sources(st.session_state._last_full_text)

# --- 既存ログの描画 ---
for role, content in st.session_state.messages:
    with st.chat_message("user" if role == "user" else "assistant"):
        st.markdown(content)

# --- OpenAI クライアント ---
client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])

# --- System 指示（出典を必ずMarkdownリンクで） ---
SYSTEM_HINT = (
    "あなたは日本語のリサーチアシスタントです。必要なときにweb_searchツールを使い、"
    "本文の最後に必ず『出典』として Markdown リンク（[タイトル](URL)）を箇条書きで示してください。"
    "本文は簡潔に要点から述べてください。"
)

# --- 入力欄 ---
if prompt := st.chat_input("質問を入力（例：『2025年の生成AIトレンドを要約して』）"):
    st.session_state.messages.append(("user", prompt))
    with st.chat_message("user"):
        st.markdown(prompt)

    tools = [{"type": "web_search"}] if enable_search else []
    kwargs_reasoning = {"reasoning": {"effort": "high"}}  # 推論レベル＝強（非対応モデルでは無視・エラー時は後述でフォールバック）

    # --- ストリーミングで本文を描画するジェネレータ ---
    def stream_once(_model, use_tools=True, use_reasoning=True):
        full = []
        extra = {}
        if use_reasoning:
            extra.update(kwargs_reasoning)

        with client.responses.stream(
            model=_model,
            input=[
                {"role": "system", "content": SYSTEM_HINT},
                {"role": "user", "content": prompt},
            ],
            tools=(tools if use_tools else []),
            **extra,
        ) as stream:
            for event in stream:
                if event.type == "response.output_text.delta":
                    chunk = event.delta
                    full.append(chunk)
                    yield chunk
                elif event.type == "response.completed":
                    break
                elif event.type == "response.error":
                    yield f"\n\n**[エラー]** {getattr(event, 'error', '不明なエラー')}\n"
        st.session_state._last_full_text = "".join(full)

    # --- 耐障害化：BadRequest のときに段階的に緩める ---
    def robust_stream():
        try:
            # 1) 指定モデル + web_search + reasoning=high
            yield from stream_once(model, use_tools=True, use_reasoning=True)
            return
        except BadRequestError as e:
            st.toast("BadRequest: パラメータを自動調整して再試行します。", icon="⚠️")
            # 2) reasoning なしで再試行
            try:
                yield from stream_once(model, use_tools=True, use_reasoning=False)
                return
            except BadRequestError:
                # 3) ツール無し（純粋回答）で再試行
                try:
                    st.toast("web_searchが非対応の可能性 → ツール無しで再試行", icon="ℹ️")
                    yield from stream_once(model, use_tools=False, use_reasoning=False)
                    return
                except BadRequestError:
                    # 4) 最終手段: モデルを gpt-4o に切替（多くの環境で安定）
                    st.warning("選択モデルが Responses+web_search 非対応の可能性。`gpt-4o` で再試行します。")
                    yield from stream_once("gpt-4o", use_tools=True, use_reasoning=False)
                    return

    with st.chat_message("assistant"):
        st.write_stream(robust_stream())

    # 履歴に最終テキストを保存
    st.session_state.messages.append(("assistant", st.session_state._last_full_text))

    # サイドバーの出典を更新
    with st.sidebar:
        st.markdown("---")
        st.header("出典（自動抽出）")
        links = re.findall(r"\[([^\]]+)\]\((https?://[^\s)]+)\)", st.session_state._last_full_text)
        urls = re.findall(r"(?<!\()(?P<url>https?://[^\s\)]+)", st.session_state._last_full_text)
        seen = set()
        for title, url in links:
            if url in seen:
                continue
            st.markdown(f"- [{title}]({url})")
            seen.add(url)
        for url in urls:
            if url not in seen:
                st.markdown(f"- <{url}>")
                seen.add(url)
