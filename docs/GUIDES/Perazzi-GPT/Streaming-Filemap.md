# Relevant Files to Incorporate Streaming:

## Backend and Types

### File Names:

- **`src/lib/aiClient.ts`**
    * **INFO** - add a streaming variant of `createResponseText` (OpenAI Responses with stream: true) so the route can emit tokens.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/lib/aiClient.ts)

- **`src/app/api/perazzi-assistant/route.ts`**
    * **INFO** - switch the handler to return a `ReadableStream/SSE`, forward streaming tokens, and fold in `citations/guardrail/meta` when the stream ends.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/app/api/perazzi-assistant/route.ts)

- **`src/types/perazzi-assistant.ts`**
    * **INFO** - add streaming chunk/final-payload types and update `PerazziAssistantResponse` so the client code stays typed.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/types/perazzi-assistant.ts)

---

## Frontend data flow (only one fetch point)

### File Names:

- **`src/components/chat/useChatState.ts`**
    * **INFO** - the sole place the frontend calls `/api/perazzi-assistant`; change this to read the stream, build the in-flight assistant message, and emit final metadata (`onResponseMeta`, context updates).
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/chat/useChatState.ts)

- **`src/hooks/usePerazziAssistant.ts`**
    * **INFO** - propagate any new streaming state/callbacks from `useChatState` so consumers can render progress or cancellation.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/hooks/usePerazziAssistant.ts)

---

## UI surfaces that consume the hook (to show streamed text cleanly everywhere)

### File Names

- **`src/components/chat/ConversationView.tsx`**
    * **INFO** - ensure it can render a partial assistant message and handle the typing indicator once streaming starts.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/chat/ConversationView.tsx)

- **`src/components/chat/ChatPanel.tsx`**
    * **INFO** - adjust pending/typing states and any copy/legacy-mode flows to coexist with a streaming assistant entry.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/chat/ChatPanel.tsx)

- **`src/components/concierge/ConciergePageShell.tsx`**
    * **INFO** - same hook consumers; keep guardrail/meta handling in sync with the streaming finish signal.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/concierge/ConciergePageShell.tsx)

- Wrappers that host the panel (**`src/components/chat/ChatWidget.tsx`**, **`src/components/chat/FullScreenChat.tsx`**) plus **`src/components/chat/ChatInput.tsx`** if pending/disabled behavior changes.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/chat/ChatWidget.tsx)
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/chat/FullScreenChat.tsx)
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/src/components/chat/ChatInput.tsx)

---

## Regression checkpoints

- Dev helpers/tests that assume JSON bodies (**`scripts/test-assistant.ts`**, **`tests/api/perazzi-assistant.test.ts`**) would also need updates if the API starts streaming, otherwise they’ll break.
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/scripts/test-assistant.ts)
    * **RAW URL** - (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/GPT-5.2/tests/api/perazzi-assistant.test.ts)

---

## There aren’t other frontend fetches to this endpoint—once `useChatState` streams correctly, all chat surfaces (widget, full-screen, concierge) pick it up.