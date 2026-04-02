import React, { useState } from 'react';

import Button from '../../../shared/ui/Button';
import Card from '../../../shared/ui/Card';
import Input from '../../../shared/ui/Input';

export default function PoolJoinCreateCard({
  loading,
  error,
  onJoin,
  onCreate,
}) {
  const [activeTab, setActiveTab] = useState('join');
  const [joinCode, setJoinCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const clearFeedback = () => {
    setMessage({ text: '', type: '' });
  };

  const handleJoinSubmit = async (event) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    clearFeedback();

    try {
      const joinedPool = await onJoin(code);
      setJoinCode('');
      setMessage({
        text: `Successfully joined ${joinedPool.name}!`,
        type: 'success',
      });
    } catch (joinError) {
      if (joinError?.code === 'invalid-invite-code') {
        setMessage({ text: 'Invalid Invite Code.', type: 'error' });
        return;
      }
      if (joinError?.code === 'already-in-pool') {
        setMessage({ text: 'You are already in this pool.', type: 'error' });
        return;
      }
      setMessage({ text: 'Error joining pool.', type: 'error' });
    }
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!createName.trim()) return;
    clearFeedback();

    try {
      const createdPool = await onCreate(createName);
      setCreateName('');
      setMessage({
        text: `Pool created! Invite Code: ${createdPool.inviteCode}`,
        type: 'success',
      });
    } catch {
      setMessage({ text: 'Error creating pool.', type: 'error' });
    }
  };

  const bannerText = message.text || (error ? 'Something went wrong with pools.' : '');
  const bannerType = message.text ? message.type : 'error';

  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="flex border-b border-slate-700/50">
        <Button
          variant="text"
          size="none"
          onClick={() => {
            setActiveTab('join');
            clearFeedback();
          }}
          className={`flex-1 px-4 py-4 text-sm font-black uppercase tracking-widest ${
            activeTab === 'join'
              ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Join Pool
        </Button>
        <Button
          variant="text"
          size="none"
          onClick={() => {
            setActiveTab('create');
            clearFeedback();
          }}
          className={`flex-1 px-4 py-4 text-sm font-black uppercase tracking-widest ${
            activeTab === 'create'
              ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Create Pool
        </Button>
      </div>

      <div className="p-6">
        {bannerText ? (
          <div
            className={`mb-4 rounded-xl p-3 text-center text-sm font-bold ${
              bannerType === 'error'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {bannerText}
          </div>
        ) : null}

        {activeTab === 'join' ? (
          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="pool-join-code"
                className="ml-1 mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                Enter 5-Character Code
              </label>
              <Input
                id="pool-join-code"
                maxLength={5}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. A7X9K"
                className="text-center font-mono text-xl font-black tracking-widest uppercase"
              />
            </div>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-lg uppercase tracking-widest text-slate-900 hover:bg-emerald-400"
            >
              {loading ? 'Joining...' : 'Join Pool'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="pool-create-name"
                className="ml-1 mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                Pool Name
              </label>
              <Input
                id="pool-create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Denver Crew 2026"
              />
            </div>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-lg uppercase tracking-widest text-slate-900 hover:bg-emerald-400"
            >
              {loading ? 'Creating...' : 'Create New Pool'}
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}
