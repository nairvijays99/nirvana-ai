'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  return (
    <main className="flex h-dvh min-w-0 flex-col bg-background">
      <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
        <h1 className="max-w-xs text-2xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          NirvanaAi
        </h1>
      </header>

      <div className="flex-1 overflow-y-scroll">
        <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4">
          <div className="flex flex-col gap-4 px-2 py-4">
            {messages.map(message => (
              <div key={message.id} className="flex flex-row gap-2">
                <div className="w-24 text-zinc-500">{`${message.role}: `}</div>
                <div className="w-full">
                  {message.parts.map(part => (part.type === 'text' ? part.text : '')).join('')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage({ text: input });
            setInput('');
          }}
          className="w-full"
        >
          <input
            value={input}
            placeholder="Send message..."
            onChange={e => setInput(e.target.value)}
            className="p-2 bg-zinc-100 text-black w-full"
          />
        </form>
      </div>
    </main>
  );
}
