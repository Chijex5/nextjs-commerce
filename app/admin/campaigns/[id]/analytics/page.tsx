"use client";

import { BarChart3, ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CampaignAnalytics {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  openRate: string;
  clickRate: string;
  bounceRate: string;
  failureRate: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  subject: string;
  status: string;
  sentAt: string;
  createdAt: string;
}

export default function CampaignAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);

  useEffect(() => {
    fetchData();
    // Refresh analytics every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch campaign details
      const campaignRes = await fetch(`/api/admin/campaigns/${campaignId}`);
      if (!campaignRes.ok) throw new Error("Failed to fetch campaign");
      const campaignData = await campaignRes.json();
      setCampaign(campaignData.campaign);

      // Fetch analytics
      const analyticsRes = await fetch(
        `/api/admin/campaigns/${campaignId}/analytics`,
      );
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !campaign || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-black rounded-full"></div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Sent",
      value: analytics.sent,
      color: "bg-blue-100 text-blue-800",
    },
    {
      label: "Opened",
      value: analytics.opened,
      subtext: `${analytics.openRate}%`,
      color: "bg-green-100 text-green-800",
    },
    {
      label: "Clicked",
      value: analytics.clicked,
      subtext: `${analytics.clickRate}%`,
      color: "bg-purple-100 text-purple-800",
    },
    {
      label: "Bounced",
      value: analytics.bounced,
      subtext: `${analytics.bounceRate}%`,
      color: "bg-red-100 text-red-800",
    },
    {
      label: "Failed",
      value: analytics.failed,
      subtext: `${analytics.failureRate}%`,
      color: "bg-orange-100 text-orange-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/admin/campaigns")}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Campaign Analytics
            </h1>
            <p className="text-gray-500 mt-2">{campaign.name}</p>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Subject</p>
              <p className="text-lg font-medium text-gray-900">
                {campaign.subject}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="text-lg font-medium text-gray-900">
                {campaign.type.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sent On</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(campaign.sentAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-lg border border-gray-200 p-6 text-center`}
            >
              <p className="text-gray-600 text-sm font-medium mb-2">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              {stat.subtext && (
                <p className="text-sm text-gray-500">{stat.subtext}</p>
              )}
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Engagement Metrics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 size={20} />
              Engagement Metrics
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">Open Rate</p>
                  <p className="text-sm font-bold text-gray-900">
                    {analytics.openRate}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(parseFloat(analytics.openRate), 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Click Rate
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {analytics.clickRate}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(parseFloat(analytics.clickRate), 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Bounce Rate
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {analytics.bounceRate}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(parseFloat(analytics.bounceRate), 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Failure Rate
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {analytics.failureRate}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(parseFloat(analytics.failureRate), 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Delivery Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700">Total Recipients</p>
                <p className="font-bold text-gray-900">{analytics.total}</p>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <p className="text-gray-700">Successfully Sent</p>
                <p className="font-bold text-green-900">{analytics.sent}</p>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <p className="text-gray-700">Failed/Bounced</p>
                <p className="font-bold text-orange-900">
                  {analytics.failed + analytics.bounced}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <p className="text-gray-700">People who Clicked</p>
                <p className="font-bold text-purple-900">{analytics.clicked}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📊 Tips to Improve Performance
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Open Rate: Try improving your subject line and send time</li>
            <li>
              • Click Rate: Use clearer CTAs and make sure links are relevant
            </li>
            <li>• Bounce Rate: Clean your mailing list regularly</li>
            <li>
              • Monitor trends: Consistent performance metrics indicate list
              health
            </li>
          </ul>
        </div>

        {/* Auto-refresh note */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Analytics refresh automatically every 10 seconds
        </div>
      </div>
    </div>
  );
}
