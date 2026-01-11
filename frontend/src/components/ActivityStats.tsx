import { useActivityStats, useActivityHistory } from "@/hooks/api/use-activities";
import { Heart, MessageCircle, Repeat2, UserPlus, AtSign, Activity as ActivityIcon, Loader2, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useState } from "react";

export default function ActivityStats() {
    const { data: stats, isLoading: isLoadingStats } = useActivityStats();
    const { data: history, isLoading: isLoadingHistory } = useActivityHistory(14); // 14 days 
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    const isLoading = isLoadingStats || isLoadingHistory;

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-gray-500" size={32} />
            </div>
        );
    }

    if (!stats || stats.total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <ActivityIcon size={32} className="text-gray-500" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">No activity yet</h3>
                    <p className="text-gray-400">When people interact with you, it will show up here.</p>
                </div>
            </div>
        );
    }

    // Chart Data Preparation
    const data = history || [];
    // Ensure data exists, otherwise default to avoid divide by zero
    const maxVal = Math.max(1, ...data.map((d: any) => Math.max(d.like, d.repost, d.reply)));
    const chartHeight = 100;
    const chartWidth = 300;
    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

    const getPoints = (key: string) => {
        return data.map((d: any, i: number) => {
            const x = i * xStep;
            const y = chartHeight - ((d[key] || 0) / maxVal) * chartHeight;
            return `${x},${y}`;
        }).join(" ");
    };

    const likePoints = getPoints('like');
    const repostPoints = getPoints('repost');
    const replyPoints = getPoints('reply');

    const maxValBar = Math.max(1, ...Object.values(stats.breakdown) as number[]);
    const getWidth = (val: number) => {
        if (val === 0) return '0%';
        const pct = (val / maxValBar) * 100;
        return `${Math.max(pct, 1)}%`;
    };

    const CONFIG = {
        like: { label: "Likes", icon: Heart, color: "text-rose-500", bg: "bg-rose-500" },
        reply: { label: "Replies", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500" },
        repost: { label: "Reposts", icon: Repeat2, color: "text-green-500", bg: "bg-green-500" },
        mention: { label: "Mentions", icon: AtSign, color: "text-orange-500", bg: "bg-orange-500" },
        follow: { label: "New Followers", icon: UserPlus, color: "text-purple-500", bg: "bg-purple-500" },
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1C2533] border border-[#2F3B4B] rounded-2xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Total Interactions</h3>
                    <div className="text-4xl font-bold text-white">{formatNumber(stats.total)}</div>
                </div>
                <div className="bg-[#1C2533] border border-[#2F3B4B] rounded-2xl p-6 flex flex-col justify-center">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Top Activity</h3>
                    <div className="text-xl font-bold text-white capitalize">
                        {Object.entries(stats.breakdown).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'None'}
                    </div>
                </div>
            </div>

            {/* Growth Chart */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    Growth Trends (14 Days)
                </h3>
                <div className="bg-[#1C2533] border border-[#2F3B4B] rounded-2xl p-4 md:p-6 relative">
                    {/* Legend */}
                    <div className="flex gap-4 mb-4 justify-end text-xs font-medium">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Likes</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Reposts</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Replies</div>
                    </div>

                    {/* Chart Area */}
                    <div className="relative h-48 w-full">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#374151" strokeOpacity="0.3" strokeDasharray="4" />
                            <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#374151" strokeOpacity="0.3" strokeDasharray="4" />
                            <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#374151" strokeOpacity="0.3" strokeDasharray="4" />

                            {/* Paths */}
                            <polyline fill="none" strokeWidth="2" stroke="#ef4444" points={likePoints} className="drop-shadow-md" />
                            <polyline fill="none" strokeWidth="2" stroke="#22c55e" points={repostPoints} className="drop-shadow-md" />
                            <polyline fill="none" strokeWidth="2" stroke="#3b82f6" points={replyPoints} strokeOpacity="0.6" strokeDasharray="2" />

                            {/* Active Points Overlay */}
                            {data.map((d: any, i: number) => {
                                const x = i * xStep;
                                return (
                                    <g key={i}>
                                        <rect
                                            x={Math.max(0, x - 10)}
                                            y="0"
                                            width="20"
                                            height={chartHeight}
                                            fill="transparent"
                                            className="cursor-pointer hover:fill-white/5 active:fill-white/10"
                                            onMouseEnter={() => setHoveredPoint(i)}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                        />
                                    </g>
                                )
                            })}
                        </svg>

                        {/* Tooltip (Simple absolute positioning) */}
                        {hoveredPoint !== null && data[hoveredPoint] && (
                            <div
                                className="absolute top-0 pointer-events-none bg-gray-900 border border-gray-700 p-2 rounded-lg shadow-xl text-xs z-50 w-32"
                                style={{
                                    left: `${(hoveredPoint / Math.max(1, data.length - 1)) * 100}%`,
                                    transform: hoveredPoint < 3
                                        ? 'translate(0%, -100%)'
                                        : hoveredPoint > data.length - 4
                                            ? 'translate(-100%, -100%)'
                                            : 'translate(-50%, -100%)',
                                    marginTop: '-10px'
                                }}
                            >
                                <div className="font-bold text-gray-300 mb-1 border-b border-gray-700 pb-1">{data[hoveredPoint].date}</div>
                                <div className="flex justify-between text-rose-400"><span>Likes</span> <span>{data[hoveredPoint].like}</span></div>
                                <div className="flex justify-between text-green-400"><span>Reposts</span> <span>{data[hoveredPoint].repost}</span></div>
                                <div className="flex justify-between text-blue-400"><span>Replies</span> <span>{data[hoveredPoint].reply}</span></div>
                            </div>
                        )}

                        {/* X Axis Labels */}
                        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                            <span>{data[0]?.date}</span>
                            <span>{data[Math.floor(data.length / 2)]?.date}</span>
                            <span>{data[data.length - 1]?.date}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Chart */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ActivityIcon size={20} className="text-primary" />
                    Interaction Breakdown
                </h3>

                <div className="space-y-5">
                    {Object.entries(stats.breakdown).map(([key, count]) => {
                        // Cast key to keyof typeof CONFIG to fix TS inference if needed
                        const config = CONFIG[key as keyof typeof CONFIG];
                        if (!config) return null;
                        const Icon = config.icon;

                        const countVal = count as number;

                        return (
                            <div key={key} className="group">
                                <div className="flex items-center justify-between mb-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors">
                                        <div className={`p-1.5 rounded-lg ${config.bg}/10`}>
                                            <Icon size={16} className={config.color} />
                                        </div>
                                        <span className="font-medium">{config.label}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-bold text-white">{formatNumber(countVal)}</span>
                                        <span className="text-xs text-gray-500">
                                            ({Math.round((countVal / stats.total) * 100)}%)
                                        </span>
                                    </div>
                                </div>

                                {/* Bar Track */}
                                <div className="h-3 w-full bg-gray-800/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${config.bg} transition-all duration-1000 ease-out`}
                                        style={{ width: getWidth(countVal) }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
