import { Bot, Search, TrendingUp } from 'lucide-react';

interface BotStatsProps {
  data: {
    totalBotVisits: number;
    aiBotVisits: number;
    searchBotVisits: number;
    topBots: Array<{ name: string; count: number }>;
    topPages: Array<{ path: string; count: number }>;
  } | null;
}

export default function BotStats({ data }: BotStatsProps) {
  if (!data || data.totalBotVisits === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600" />
          AI & Search Bots
        </h2>
        <p className="text-gray-500 text-sm text-center py-8">
          Brak wizyt botów AI w tym okresie
        </p>
      </div>
    );
  }

  const aiPercentage = data.totalBotVisits > 0
    ? Math.round((data.aiBotVisits / data.totalBotVisits) * 100)
    : 0;

  const searchPercentage = data.totalBotVisits > 0
    ? Math.round((data.searchBotVisits / data.totalBotVisits) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Bot className="h-5 w-5 text-purple-600" />
        AI & Search Bot Tracking
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <p className="text-xs font-medium text-purple-700 uppercase">Wszystkie boty</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">{data.totalBotVisits}</p>
          <p className="text-xs text-purple-600 mt-1">wizyt</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-blue-700 uppercase">AI Bots</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{data.aiBotVisits}</p>
          <p className="text-xs text-blue-600 mt-1">{aiPercentage}% wszystkich</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-700 uppercase">Search Bots</p>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{data.searchBotVisits}</p>
          <p className="text-xs text-emerald-600 mt-1">{searchPercentage}% wszystkich</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Bots */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            Najczęściej odwiedzające boty
          </h3>
          <div className="space-y-2">
            {data.topBots.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Brak danych</p>
            ) : (
              data.topBots.map((bot, index) => (
                <div
                  key={bot.name}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {bot.name}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-purple-600">{bot.count}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Pages */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">📄</span>
            Najczęściej indeksowane strony
          </h3>
          <div className="space-y-2">
            {data.topPages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Brak danych</p>
            ) : (
              data.topPages.map((page, index) => (
                <div
                  key={page.path}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-700 truncate">
                      {page.path}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-blue-600">{page.count}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">ℹ️ Info:</span> Tracking obejmuje AI boty (ChatGPT, Claude, Perplexity, Google-Extended) 
          oraz tradycyjne wyszukiwarki (Googlebot, Bingbot). To pozwala monitorować jak strona jest indeksowana 
          przez AI i klasyczne wyszukiwarki.
        </p>
      </div>
    </div>
  );
}
