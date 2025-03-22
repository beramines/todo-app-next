# Simple TODO App

これは [Next.js](https://nextjs.org) を使用して作成されたシンプルなTODOアプリです。このプロジェクトは [Claude Desktop](https://www.anthropic.com/claude) と Claude Code MCPを利用して作成されました。

## 機能

- タスクの追加、削除、完了状態の切り替え
- 期限の設定
- 優先度（高/中/低）の設定
- ダークモード/ライトモードの切り替え
- フィルタリング（すべて/未完了/完了済み）
- ローカルストレージを使ったデータの永続化

## 技術スタック

- [Next.js](https://nextjs.org) - Reactフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型付きJavaScript
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク

## 開発方法

開発サーバーを起動します：

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開くとアプリが表示されます。

`src/app/components/TodoApp.tsx` を編集することでアプリの機能を変更できます。

## About Claude

このアプリは [Anthropic](https://www.anthropic.com/) の大規模言語モデル「Claude」を使用して作成されました。Claude は自然な会話を通じてコーディング、デザイン、問題解決をサポートする AI アシスタントです。

- [Claude Desktop](https://www.anthropic.com/claude) - デスクトップアプリケーション
- Claude Code MCP - コード生成と開発をサポートする機能

## ライセンス

[MIT](https://choosealicense.com/licenses/mit/)
