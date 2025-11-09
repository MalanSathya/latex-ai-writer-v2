import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ApiKeySettings() {
  const { user } = useAuth();
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('openai_api_key, gemini_api_key')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          setOpenaiApiKey(data.openai_api_key || '');
          setGeminiApiKey(data.gemini_api_key || '');
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch API keys');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, openai_api_key: openaiApiKey, gemini_api_key: geminiApiKey });

      if (error) throw error;
      toast.success('API keys saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save API keys');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model API Keys</CardTitle>
        <CardDescription>Add your own API keys for the AI models. OpenAI is used by default, with Gemini as a fallback.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <Input
              id="openai-api-key"
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gemini-api-key">Gemini API Key (Fallback)</Label>
            <Input
              id="gemini-api-key"
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
