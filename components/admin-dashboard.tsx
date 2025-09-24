'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Award, Users, FileText, TrendingUp, RefreshCw } from 'lucide-react';

export function AdminDashboard() {
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    totalInspirations: 0,
    pendingSubmissions: 0,
    todayViews: 0,
    weeklyGrowth: 0,
  });
  const [submissions, setSubmissions] = useState([]);
  const [inspirations, setInspirations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
    }
  };

  const fetchInspirations = async () => {
    try {
      const response = await fetch('/api/admin/inspirations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setInspirations(data);
      }
    } catch (error) {
      console.error('Failed to fetch inspirations:', error);
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
        fetchStats();
      } else {
        throw new Error('Failed to update submission');
      }
    } catch (error) {
      toast.error('Failed to update submission');
    }
  };

  const setAwardPick = async (inspirationId: string) => {
    try {
      const response = await fetch('/api/admin/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ inspirationId }),
      });

      if (response.ok) {
        toast.success('Award pick updated successfully');
      } else {
        throw new Error('Failed to set award pick');
      }
    } catch (error) {
      toast.error('Failed to set award pick');
    }
  };

  const triggerScraping = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (response.ok) {
        toast.success('Scraping initiated successfully');
        fetchStats();
        fetchInspirations();
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
    fetchStats();
    fetchSubmissions();
    fetchInspirations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={logout}>
          Sign Out
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspirations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInspirations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Growth</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.weeklyGrowth}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="inspirations">Inspirations</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-muted-foreground">No pending submissions</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission: any) => (
                    <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{submission.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {submission.submitterName} ({submission.submitterEmail})
                          </p>
                          <p className="text-sm">{submission.description}</p>
                        </div>
                        <Badge variant="outline">{submission.platform}</Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmissionReview(submission.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSubmissionReview(submission.id, 'rejected')}
                        >
                          Reject
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={submission.contentUrl} target="_blank" rel="noopener noreferrer">
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

        <TabsContent value="inspirations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspirations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspirations.slice(0, 10).map((inspiration: any) => (
                  <div key={inspiration.id} className="flex justify-between items-center border rounded-lg p-3">
                    <div>
                      <h3 className="font-medium">{inspiration.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {inspiration.platform} • Score: {Math.round(inspiration.score)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAwardPick(inspiration.id)}
                    >
                      Set as Award Pick
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={triggerScraping}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Scraping in Progress...' : 'Trigger Manual Scraping'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}