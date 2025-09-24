'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { 
  Award, Users, FileText, TrendingUp, RefreshCw, Search, Filter, 
  Calendar, Edit3, Archive, Trash2, Eye, BarChart3, PieChart,
  Settings, Download, Upload, CheckCircle, XCircle, Clock,
  ArrowUp, ArrowDown, Zap, Star, Target, Play, Pause
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie } from 'recharts';

interface AnalyticsData {
  overview: {
    totalInspirations: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    weeklyGrowth: number;
    lastWeekInspirations: number;
  };
  platformStats: Array<{ platform: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  monthlyStats: Record<string, number>;
  topInspirations: Array<any>;
  recentAwards: Array<any>;
}

export function EnhancedAdminDashboard() {
  const { logout } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [submissions, setSubmissions] = useState([]);
  const [inspirations, setInspirations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contentFilter, setContentFilter] = useState({
    search: '',
    platform: 'all',
    archived: false,
    page: 1,
    limit: 20,
  });
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [curationDate, setCurationDate] = useState(new Date().toISOString().split('T')[0]);
  const [curationData, setCurationData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    }
  };

  const fetchContent = async () => {
    try {
      const params = new URLSearchParams({
        page: contentFilter.page.toString(),
        limit: contentFilter.limit.toString(),
        ...(contentFilter.search && { search: contentFilter.search }),
        ...(contentFilter.platform !== 'all' && { platform: contentFilter.platform }),
        archived: contentFilter.archived.toString(),
      });

      const response = await fetch(`/api/admin/content?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setInspirations(data.inspirations);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
      toast.error('Failed to load content');
    }
  };

  const fetchCuration = async (date?: string) => {
    try {
      const targetDate = date || curationDate;
      const response = await fetch(`/api/admin/curation?date=${targetDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurationData(data);
      }
    } catch (error) {
      console.error('Failed to fetch curation:', error);
      toast.error('Failed to load curation data');
    }
  };

  const handleSubmissionReview = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });

      if (response.ok) {
        toast.success(`Submission ${status} successfully`);
        fetchSubmissions();
        fetchAnalytics();
      } else {
        throw new Error('Failed to update submission');
      }
    } catch (error) {
      toast.error('Failed to update submission');
    }
  };

  const handleBulkContentAction = async (action: string, data?: any) => {
    if (selectedContent.length === 0) {
      toast.error('Please select content items first');
      return;
    }

    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ ids: selectedContent, action, data }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.updated} items ${action}d successfully`);
        setSelectedContent([]);
        fetchContent();
        fetchAnalytics();
      } else {
        throw new Error('Failed to update content');
      }
    } catch (error) {
      toast.error(`Failed to ${action} content`);
    }
  };

  const setCurationPick = async (type: 'award' | 'top10', inspirationId?: string, top10Ids?: string[]) => {
    try {
      const data: any = { date: curationDate };
      if (type === 'award') data.awardPickId = inspirationId;
      if (type === 'top10') data.top10Ids = top10Ids;

      const response = await fetch('/api/admin/curation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(`${type === 'award' ? 'Award pick' : 'Top 10 list'} updated successfully`);
        fetchCuration();
      } else {
        throw new Error('Failed to update curation');
      }
    } catch (error) {
      toast.error('Failed to update curation');
    }
  };

  const triggerScraping = async (platform?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ platform }),
      });

      if (response.ok) {
        toast.success('Scraping initiated successfully');
        fetchAnalytics();
        fetchContent();
      } else {
        throw new Error('Failed to trigger scraping');
      }
    } catch (error) {
      toast.error('Failed to trigger scraping');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchSubmissions();
    fetchContent();
    fetchCuration();
  }, []);

  useEffect(() => {
    fetchContent();
  }, [contentFilter]);

  useEffect(() => {
    fetchCuration();
  }, [curationDate]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive content management and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchAnalytics(); fetchContent(); fetchSubmissions(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalInspirations}</div>
            <p className="text-xs text-muted-foreground">Inspirations in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.approvedSubmissions}</div>
            <p className="text-xs text-muted-foreground">Approved submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.lastWeekInspirations}</div>
            <p className="text-xs text-muted-foreground">New content added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            {analytics.overview.weeklyGrowth >= 0 ? 
              <ArrowUp className="h-4 w-4 text-green-600" /> : 
              <ArrowDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              analytics.overview.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics.overview.weeklyGrowth >= 0 ? '+' : ''}{analytics.overview.weeklyGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Week over week</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Platform Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={analytics.platformStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, count }) => `${platform}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.platformStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Content Trends (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyStats.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="curation">Curation</TabsTrigger>
          <TabsTrigger value="scraping">Scraping</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Performing Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topInspirations.slice(0, 5).map((inspiration: any) => (
                    <div key={inspiration.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {inspiration.thumbnailUrl && (
                          <img 
                            src={inspiration.thumbnailUrl} 
                            alt={inspiration.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-medium truncate max-w-xs">{inspiration.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {inspiration.platform} • {inspiration.authorName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        Score: {Math.round(inspiration.score)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => triggerScraping()}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <Zap className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Scraping in Progress...' : 'Trigger Full Scraping'}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setActiveTab('submissions')}>
                    <Clock className="w-4 h-4 mr-2" />
                    Review ({analytics.overview.pendingSubmissions})
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('curation')}>
                    <Award className="w-4 h-4 mr-2" />
                    Curate Today
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">System Status</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Content Pipeline</span>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Pending Submissions
                </span>
                <Badge variant="secondary">{submissions.length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-muted-foreground">No pending submissions to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission: any) => (
                    <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{submission.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {submission.submitterName} ({submission.submitterEmail})
                          </p>
                          <p className="text-sm mt-2">{submission.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{submission.platform}</Badge>
                            {submission.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmissionReview(submission.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSubmissionReview(submission.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={submission.contentUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-2" />
                            View Original
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Content Management
                </span>
                {selectedContent.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkContentAction('archive')}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive ({selectedContent.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBulkContentAction('delete')}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedContent.length})
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search content..."
                    value={contentFilter.search}
                    onChange={(e) => setContentFilter({ ...contentFilter, search: e.target.value })}
                    className="max-w-sm"
                  />
                </div>
                <Select
                  value={contentFilter.platform}
                  onValueChange={(value) => setContentFilter({ ...contentFilter, platform: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All platforms</SelectItem>
                    <SelectItem value="Behance">Behance</SelectItem>
                    <SelectItem value="Dribbble">Dribbble</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Core77">Core77</SelectItem>
                    <SelectItem value="Awwwards">Awwwards</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="archived"
                    checked={contentFilter.archived}
                    onCheckedChange={(checked) => 
                      setContentFilter({ ...contentFilter, archived: checked as boolean })
                    }
                  />
                  <Label htmlFor="archived">Show archived</Label>
                </div>
              </div>

              <div className="space-y-4">
                {inspirations.map((inspiration: any) => (
                  <div key={inspiration.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedContent.includes(inspiration.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContent([...selectedContent, inspiration.id]);
                          } else {
                            setSelectedContent(selectedContent.filter(id => id !== inspiration.id));
                          }
                        }}
                      />
                      
                      {inspiration.thumbnailUrl && (
                        <img 
                          src={inspiration.thumbnailUrl} 
                          alt={inspiration.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{inspiration.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {inspiration.platform} • {inspiration.authorName} • Score: {Math.round(inspiration.score)}
                            </p>
                            {inspiration.description && (
                              <p className="text-sm mt-1 line-clamp-2">{inspiration.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {inspiration.archived && (
                              <Badge variant="secondary">Archived</Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCurationPick('award', inspiration.id)}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Set as Award
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          {inspiration.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Daily Curation Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="curation-date">Date:</Label>
                  <Input
                    id="curation-date"
                    type="date"
                    value={curationDate}
                    onChange={(e) => setCurationDate(e.target.value)}
                    className="w-48"
                  />
                </div>

                {curationData && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Current Award Pick</h3>
                      {curationData.awardPick ? (
                        <div className="border rounded-lg p-4 bg-yellow-50">
                          <div className="flex items-center gap-4">
                            {curationData.awardPick.thumbnailUrl && (
                              <img 
                                src={curationData.awardPick.thumbnailUrl} 
                                alt={curationData.awardPick.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{curationData.awardPick.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {curationData.awardPick.platform} • {curationData.awardPick.authorName}
                              </p>
                              <Badge variant="outline">Score: {Math.round(curationData.awardPick.score)}</Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription>
                            No award pick set for this date. Select content from the content tab to set as award pick.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Top 10 List</h3>
                      {curationData.top10Inspirations && curationData.top10Inspirations.length > 0 ? (
                        <div className="space-y-2">
                          {curationData.top10Inspirations.map((inspiration: any, index: number) => (
                            <div key={inspiration.id} className="flex items-center gap-4 border rounded-lg p-3">
                              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              {inspiration.thumbnailUrl && (
                                <img 
                                  src={inspiration.thumbnailUrl} 
                                  alt={inspiration.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium">{inspiration.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {inspiration.platform} • Score: {Math.round(inspiration.score)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription>
                            No top 10 list set for this date. Use the content management to curate the top 10.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scraping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Scraping Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={() => triggerScraping()}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <Zap className={`w-6 h-6 mb-2 ${isLoading ? 'animate-spin' : ''}`} />
                  All Platforms
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => triggerScraping('Behance')}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <Download className="w-6 h-6 mb-2" />
                  Behance Only
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => triggerScraping('Dribbble')}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <Download className="w-6 h-6 mb-2" />
                  Dribbble Only
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => triggerScraping('Medium')}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <Download className="w-6 h-6 mb-2" />
                  Medium Only
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => triggerScraping('Core77')}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <Download className="w-6 h-6 mb-2" />
                  Core77 Only
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => triggerScraping('Awwwards')}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <Download className="w-6 h-6 mb-2" />
                  Awwwards Only
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Scraping Status</h3>
                <div className="space-y-2">
                  {['Behance', 'Dribbble', 'Medium', 'Core77', 'Awwwards'].map((platform) => (
                    <div key={platform} className="flex items-center justify-between p-3 border rounded">
                      <span>{platform}</span>
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Content Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analytics.monthlyStats).map(([month, count]) => ({ month, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.platformStats.map((stat, index) => (
                    <div key={stat.platform} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{stat.platform}</span>
                        <span>{stat.count} items</span>
                      </div>
                      <Progress 
                        value={(stat.count / analytics.overview.totalInspirations) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}