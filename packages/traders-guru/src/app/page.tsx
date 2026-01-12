'use client';

import { useState } from 'react';

interface TradingSignal {
  symbol: string;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  price: number;
  timestamp: string;
}

export default function TradersGuru() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [error, setError] = useState('');

  const analyzeSymbol = async () => {
    if (!symbol.trim()) {
      setError('Please enter a trading pair (e.g., BTCUSDT)');
      return;
    }

    setLoading(true);
    setError('');
    setSignal(null);

    try {
      const response = await fetch(`/api/analyze?symbol=${symbol.toUpperCase()}`);
      const data = await response.json() as TradingSignal & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze');
      }

      setSignal(data as TradingSignal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze symbol');
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (sig: string) => {
    if (sig === 'BUY') return 'text-green-400';
    if (sig === 'SELL') return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSignalBg = (sig: string) => {
    if (sig === 'BUY') return 'bg-green-500/20 border-green-500/50';
    if (sig === 'SELL') return 'bg-red-500/20 border-red-500/50';
    return 'bg-yellow-500/20 border-yellow-500/50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Traders Guru
          </h1>
          <p className="text-xl text-gray-300">
            AI-Powered Crypto Trading Signals
          </p>
          <p className="text-sm text-gray-400 mt-2">
            RSI & MACD Analysis for Perpetual/Futures Trading
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && analyzeSymbol()}
              placeholder="Enter trading pair (e.g., BTCUSDT)"
              className="flex-1 px-6 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={analyzeSymbol}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {signal && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 space-y-6">
            {/* Signal Badge */}
            <div className="text-center">
              <div className={`inline-block px-8 py-4 rounded-2xl border-2 ${getSignalBg(signal.signal)}`}>
                <div className="text-sm text-gray-300 mb-1">Trading Signal</div>
                <div className={`text-4xl font-bold ${getSignalColor(signal.signal)}`}>
                  {signal.signal}
                </div>
              </div>
            </div>

            {/* Price Info */}
            <div className="text-center border-b border-white/10 pb-6">
              <div className="text-2xl font-bold">{signal.symbol}</div>
              <div className="text-3xl font-mono mt-2">${signal.price.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-2">{new Date(signal.timestamp).toLocaleString()}</div>
            </div>

            {/* Indicators */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* RSI */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">RSI (14)</div>
                <div className="text-3xl font-bold mb-3">{signal.rsi.toFixed(2)}</div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      signal.rsi > 70 ? 'bg-red-500' : signal.rsi < 30 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${signal.rsi}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Oversold (30)</span>
                  <span>Overbought (70)</span>
                </div>
              </div>

              {/* MACD */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">MACD</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">MACD:</span>
                    <span className="font-mono">{signal.macd.macd.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Signal:</span>
                    <span className="font-mono">{signal.macd.signal.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Histogram:</span>
                    <span className={`font-mono ${signal.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {signal.macd.histogram.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-gray-400 text-center pt-4 border-t border-white/10">
              ⚠️ This is not financial advice. Always do your own research before trading.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


