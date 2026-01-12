import { NextRequest, NextResponse } from 'next/server';

interface KlineData {
  closeTime: number;
  close: string;
}

// Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Calculate EMA
function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  ema[0] = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}

// Calculate MACD
function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  const macdLine = ema12.map((val, i) => val - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((val, i) => val - signalLine[i]);

  const lastIndex = prices.length - 1;

  return {
    macd: macdLine[lastIndex],
    signal: signalLine[lastIndex],
    histogram: histogram[lastIndex],
  };
}

// Determine trading signal
function determineSignal(rsi: number, macd: { macd: number; signal: number; histogram: number }): 'BUY' | 'SELL' | 'NEUTRAL' {
  let buySignals = 0;
  let sellSignals = 0;

  // RSI signals
  if (rsi < 30) buySignals++;
  if (rsi > 70) sellSignals++;

  // MACD signals
  if (macd.histogram > 0 && macd.macd > macd.signal) buySignals++;
  if (macd.histogram < 0 && macd.macd < macd.signal) sellSignals++;

  if (buySignals > sellSignals) return 'BUY';
  if (sellSignals > buySignals) return 'SELL';
  return 'NEUTRAL';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Fetch kline data from Binance (1 hour interval, 100 candles for sufficient data)
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`;
    const response = await fetch(binanceUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid symbol or Binance API error' }, { status: 400 });
    }

    const klines = await response.json();
    
    if (!Array.isArray(klines) || klines.length === 0) {
      return NextResponse.json({ error: 'No data available for this symbol' }, { status: 400 });
    }

    // Extract closing prices
    const closePrices = klines.map((k: any) => parseFloat(k[4]));
    const currentPrice = closePrices[closePrices.length - 1];

    // Calculate indicators
    const rsi = calculateRSI(closePrices);
    const macd = calculateMACD(closePrices);
    const signal = determineSignal(rsi, macd);

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: currentPrice,
      rsi,
      macd,
      signal,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symbol' },
      { status: 500 }
    );
  }
}

