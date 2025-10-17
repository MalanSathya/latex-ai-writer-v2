import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Edit } from 'lucide-react';

export default function CoverLetterEditor() {
  const { user } = useAuth();
  const [latexContent, setLatexContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCoverLetter();
  }, [user]);

  const loadCoverLetter = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('cover_letters')
      .select('latex_content')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .maybeSingle();
    
    if (error) {
      console.error('Error loading cover letter:', error);
      toast.error('Failed to load cover letter');
    } else if (data) {
      setLatexContent(data.latex_content);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !latexContent.trim()) {
      toast.error('Please enter your LaTeX cover letter content');
      return;
    }

    setSaving(true);

    try {
      // First, set current cover letter to false
      await supabase
        .from('cover_letters')
        .update({ is_current: false })
        .eq('user_id', user.id)
        .eq('is_current', true);

      // Then insert new version
      const { error } = await supabase.from('cover_letters').insert({
        user_id: user.id,
        latex_content: latexContent,
        version: 1, // You might want to increment this
        is_current: true,
      });

      if (error) throw error;

      toast.success('Cover letter updated successfully!');
    } catch (error: any) {
      console.error('Error updating cover letter:', error);
      toast.error(error.message || 'Failed to update cover letter');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading cover letter...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5 text-primary" />
          Edit Cover Letter
        </CardTitle>
        <CardDescription>
          Update your master LaTeX cover letter template. Changes will be used for all future generations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="latex-content">LaTeX Cover Letter Content</Label>
          <Textarea
            id="latex-content"
            placeholder="Paste your LaTeX cover letter here..."
            value={latexContent}
            onChange={(e) => setLatexContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Cover Letter'}
        </Button>
      </CardContent>
    </Card>
  );
}
