import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Edit } from 'lucide-react';

export default function ResumeEditor() {
  const { user } = useAuth();
  const [latexContent, setLatexContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadResume();
  }, [user]);

  const loadResume = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('resumes')
      .select('latex_content')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .maybeSingle();
    
    if (error) {
      console.error('Error loading resume:', error);
      toast.error('Failed to load resume');
    } else if (data) {
      setLatexContent(data.latex_content);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !latexContent.trim()) {
      toast.error('Please enter your LaTeX resume content');
      return;
    }

    setSaving(true);

    try {
      // First, set current resume to false
      await supabase
        .from('resumes')
        .update({ is_current: false })
        .eq('user_id', user.id)
        .eq('is_current', true);

      // Then insert new version
      const { error } = await supabase.from('resumes').insert({
        user_id: user.id,
        latex_content: latexContent,
        version: 1, // You might want to increment this
        is_current: true,
      });

      if (error) throw error;

      toast.success('Resume updated successfully!');
    } catch (error: any) {
      console.error('Error updating resume:', error);
      toast.error(error.message || 'Failed to update resume');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading resume...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5 text-primary" />
          Edit Resume
        </CardTitle>
        <CardDescription>
          Update your master LaTeX resume template. Changes will be used for all future optimizations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="latex-content">LaTeX Resume Content</Label>
          <Textarea
            id="latex-content"
            placeholder="Paste your LaTeX resume here..."
            value={latexContent}
            onChange={(e) => setLatexContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Resume'}
        </Button>
      </CardContent>
    </Card>
  );
}
