import re
import streamlit as st
from openai import OpenAI

st.set_page_config(page_title="GPT-5 Search × Streamlit", page_icon="🔎")

st.title("🔎 GPT-5 Web検索チャット（Streaming / High Reasoning）")

# --- 会話ログ ---
if "messages" not in st.session_state:
    st.session_state.messages = []
if "_last_full_text" not in st.session_state:
    st.session_state._last_full_text = ""

# --- サイドバー：設定／出典 ---
with st.sidebar:
    st.header("設定")
    model = st.selectbox(
        "モデル",
        [
            "gpt-5",                       # ツール対応の最新モデルを想定
            "gpt-4o-mini-search-preview", # 検索特化の軽量プレビュー
        ],
        index=0,
        help="ツール（web_search）対応はモデルページで要確認。"
    )
    enable_search = st.toggle("ウェブ検索を許可する", value=True)
    st.caption("検索を許可すると、必要に応じてWeb検索を使います。")

    st.markdown("---")
    st.header("出典（自動抽出）")
    # 出典は直前の最終テキストから抽出して描画（下で更新）
    def render_sources(md_text: str):
        # Markdownリンク形式 [title](url) を優先抽出
        links = re.findall(r"\[([^\]]+)\]\((https?://[^\s)]+)\)", md_text)
        # プレーンURLの補助抽出
        urls  = re.findall(r"(?<!\()(?P<url>https?://[^\s\)]+)", md_text)
        seen = set()
        if links:
            for title, url in links:
                if url in seen: 
                    continue
                st.markdown(f"- [{title}]({url})")
                seen.add(url)
        # 補助：Markdownリンクに含まれなかったURLも掲示
        for url in urls:
            if url not in seen:
                st.markdown(f"- <{url}>")
                seen.add(url)

    render_sources(st.session_state._last_full_text)

# --- 既存メッセージ描画（チャットUI） ---
for role, content in st.session_state.messages:
    with st.chat_message("user" if role == "user" else "assistant"):
        st.markdown(content)

# --- OpenAIクライアント ---
client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])

# --- System指示（出典を必ず末尾にMarkdownリンクで） ---
SYSTEM_HINT = (
    "あなたは日本語のリサーチアシスタントです。必要なときにweb_searchツールを使い、"
    "本文の最後に必ず『出典』として Markdown リンク（[タイトル](URL)）を箇条書きで示してください。"
    "本文は簡潔に、要点から述べてください。"
)

# --- 入力欄 ---
if prompt := st.chat_input("質問を入力（例：『最新の生成AIトレンドを要約して』）"):
    st.session_state.messages.append(("user", prompt))
    with st.chat_message("user"):
        st.markdown(prompt)

    tools = [{"type": "web_search"}] if enable_search else []

    # ストリーミング吐き出し用のジェネレータ
    def response_streamer():
        """
        OpenAI Responses APIのイベントストリームから本文を逐次取り出し、
        画面にタイプライタ表示しつつ全文を蓄積してサイドバーで出典抽出に使う。
        """
        full_text = []
        # reasoning: effort='high' を明示（非対応モデルは無視）
        kwargs = {"reasoning": {"effort": "high"}}  # 推論レベル＝強

        with client.responses.stream(
            model=model,
            input=[
                {"role": "system", "content": SYSTEM_HINT},
                {"role": "user", "content": prompt},
            ],
            tools=tools,
            **kwargs,
        ) as stream:
            for event in stream:
                # 文章のトークン差分（正式イベント名）
                if event.type == "response.output_text.delta":
                    chunk = event.delta
                    full_text.append(chunk)
                    yield chunk  # st.write_stream 用
                # 応答完了イベント
                elif event.type == "response.completed":
                    break
                # エラーをUIに出す
                elif event.type == "response.error":
                    yield f"\n\n**[エラー]** {getattr(event, 'error', '不明なエラー')}\n"

        # 最終テキストをセッションに保存→サイドバーの出典描画で使用
        st.session_state._last_full_text = "".join(full_text)

    with st.chat_message("assistant"):
        # Streamlit のタイプライタ表示（公式API）でストリーミング描画
        st.write_stream(response_streamer())  # ← これだけで逐次出力できる

    # 会話履歴にアシスタント発話（全文）を保存
    st.session_state.messages.append(("assistant", st.session_state._last_full_text))

    # サイドバーの出典を更新（最新の全文から抽出）
    with st.sidebar:
        st.markdown("---")
        st.header("出典（自動抽出）")
        # 上で定義した描画関数を再実行
        links = re.findall(r"\[([^\]]+)\]\((https?://[^\s)]+)\)", st.session_state._last_full_text)
        urls  = re.findall(r"(?<!\()(?P<url>https?://[^\s\)]+)", st.session_state._last_full_text)
        seen = set()
        if links:
            for title, url in links:
                if url in seen: 
                    continue
                st.markdown(f"- [{title}]({url})")
                seen.add(url)
        for url in urls:
            if url not in seen:
                st.markdown(f"- <{url}>")
                seen.add(url)
