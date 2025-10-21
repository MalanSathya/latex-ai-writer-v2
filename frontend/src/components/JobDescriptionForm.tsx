import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, Download } from 'lucide-react';

export default function JobDescriptionForm() {
  const { user, session } = useAuth();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState<any>(null);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setOptimization(null);
    setCoverLetter(null);

    try {
      // Save job description
      const { data: jdData, error: jdError } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: user.id,
          title,
          company,
          description,
        })
        .select()
        .single();

      if (jdError) throw jdError;

      // Call AI optimization function
      if (!session) {
        throw new Error('Not authenticated');
      }
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobDescriptionId: jdData.id }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to optimize resume';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      const optimizationData = await response.json();
      setOptimization(optimizationData);

      // Generate cover letter
      const coverLetterResponse = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobDescriptionId: jdData.id }),
      });

      if (coverLetterResponse.ok) {
        const coverLetterData = await coverLetterResponse.json();
        setCoverLetter(coverLetterData);
        toast.success('Resume and cover letter generated successfully!');
      } else {
        let errorMessage = 'Failed to generate cover letter';
        try {
          const errorData = await coverLetterResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await coverLetterResponse.text();
        }
        toast.error(errorMessage);
        toast.success('Resume optimized successfully!');
      }
      
      // Reset form
      setTitle('');
      setCompany('');
      setDescription('');
    } catch (error: any) {
      console.error('Error optimizing resume:', error);
      toast.error(error.message || 'Failed to optimize resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (type: 'resume' | 'cover-letter') => {
    const data = type === 'resume' ? optimization : coverLetter;
    if (!data) return;

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ optimizationId: data.id }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      const pdfData = await response.json();

      // Create a blob from the base64 PDF data
      const pdfBlob = await fetch(`data:application/pdf;base64,${pdfData.pdf}`).then(r => r.blob());
      const url = URL.createObjectURL(pdfBlob);
      
      // Download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${data.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${type === 'resume' ? 'Resume' : 'Cover letter'} PDF downloaded successfully!`);
    } catch (error: any) {
      console.error(`Error downloading ${type} PDF:`, error);
      toast.error(error.message || `Failed to generate ${type} PDF`);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleOptimize} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title *</Label>
            <Input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Job Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the complete job description here..."
            className="min-h-[200px]"
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? 'Optimizing...' : 'Optimize Resume'}
        </Button>
      </form>

      {optimization && (
        <div className="space-y-6">
          <Card className="shadow-[var(--shadow-elegant)] border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Resume Optimization Results
              </CardTitle>
              <CardDescription>
                ATS Score: <span className="font-bold text-accent">{optimization.ats_score}%</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">AI Suggestions:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {optimization.suggestions}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Optimized LaTeX:</h4>
                <Textarea
                  value={optimization.optimized_latex}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <Button onClick={() => handleDownloadPDF('resume')} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Resume PDF
              </Button>
            </CardContent>
          </Card>

          {coverLetter && (
            <Card className="shadow-[var(--shadow-elegant)] border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Cover Letter Generation Results
                </CardTitle>
                <CardDescription>
                  ATS Score: <span className="font-bold text-accent">{coverLetter.ats_score}%</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">AI Suggestions:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {coverLetter.suggestions}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Generated LaTeX:</h4>
                  <Textarea
                    value={coverLetter.optimized_latex}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
                <Button onClick={() => handleDownloadPDF('cover-letter')} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Cover Letter PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
