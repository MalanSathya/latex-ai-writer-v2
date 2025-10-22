// ...existing code...
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

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

      // Call AI optimization function using Supabase Edge Function
    const sessionData = await supabase.auth.getSession();
    const session = sessionData?.data?.session; // Get the session object, which can be null

    if (!session || !session.access_token) { // Explicitly check for session and access_token
      throw new Error("User not authenticated.");
    }
    const accessToken = session.access_token; // Now accessToken is guaranteed to be a string
    const response = await fetch('/api/optimize-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ jobDescriptionId: jdData.id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to optimize resume');
    }

    const optimizationData = await response.json();
    const optimizationError = null; // No error if response.ok

      if (optimizationError) throw optimizationError;
      setOptimization(optimizationData);

      // Generate cover letter using Supabase Edge Function
      const sessionDataCoverLetter = await supabase.auth.getSession();
      const sessionCoverLetter = sessionDataCoverLetter?.data?.session;

      if (!sessionCoverLetter || !sessionCoverLetter.access_token) {
        throw new Error("User not authenticated.");
      }
      const accessTokenCoverLetter = sessionCoverLetter.access_token;

      const coverLetterResponse = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessTokenCoverLetter}`,
        },
        body: JSON.stringify({ jobDescriptionId: jdData.id }),
      });

      if (!coverLetterResponse.ok) {
        const errorData = await coverLetterResponse.json();
        throw new Error(errorData.error || 'Failed to generate cover letter');
      }

      const coverLetterData = await coverLetterResponse.json();
      const coverLetterError = null; // No error if coverLetterResponse.ok

      if (coverLetterError) {
        toast.error('Failed to generate cover letter');
      } else {
        setCoverLetter(coverLetterData);
        toast.success('Resume and cover letter generated successfully!');
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
      // Convert LaTeX to PDF using your LaTeX conversion API
      const response = await fetch('https://mynsuwuznnjqwhaurcmk.supabase.co/functions/v1/latex-convert', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_LATEX_CONVERT_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latex: data.optimized_latex
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to convert LaTeX to PDF');
      }

      const pdfData = await response.json();
      
      // Create a blob from the base64 PDF data
      const pdfBlob = await fetch(`data:application/pdf;base64,${pdfData.pdf}`).then(r => r.blob());
      
      // Download the file
      const url = URL.createObjectURL(pdfBlob);
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
// ...existing code...

// import { useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { supabase } from '@/integrations/supabase/client';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { toast } from 'sonner';
// import { Sparkles, Download } from 'lucide-react';

// export default function JobDescriptionForm() {
//   const { user, session } = useAuth();
//   const [title, setTitle] = useState('');
//   const [company, setCompany] = useState('');
//   const [description, setDescription] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [optimization, setOptimization] = useState<any>(null);
//   const [coverLetter, setCoverLetter] = useState<any>(null);

//   const handleOptimize = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user || !description.trim()) {
//       toast.error('Please fill in all required fields');
//       return;
//     }

//     setLoading(true);
//     setOptimization(null);
//     setCoverLetter(null);

//     try {
//       // Save job description
//       const { data: jdData, error: jdError } = await supabase
//         .from('job_descriptions')
//         .insert({
//           user_id: user.id,
//           title,
//           company,
//           description,
//         })
//         .select()
//         .single();

//       if (jdError) throw jdError;

//       // Call AI optimization function using Supabase Edge Function
//       const { data: optimizationData, error: optimizationError } = await supabase.functions.invoke('optimize-resume', {
//         body: { jobDescriptionId: jdData.id }
//       });

//       if (optimizationError) throw optimizationError;
//       setOptimization(optimizationData);

//       // Generate cover letter using Supabase Edge Function
//       const { data: coverLetterData, error: coverLetterError } = await supabase.functions.invoke('generate-cover-letter', {
//         body: { jobDescriptionId: jdData.id }
//       });

//       if (coverLetterError) {
//         toast.error('Failed to generate cover letter');
//       } else {
//         setCoverLetter(coverLetterData);
//         toast.success('Resume and cover letter generated successfully!');
//       }
      
//       // Reset form
//       setTitle('');
//       setCompany('');
//       setDescription('');
//     } catch (error: any) {
//       console.error('Error optimizing resume:', error);
//       toast.error(error.message || 'Failed to optimize resume');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownloadPDF = async (type: 'resume' | 'cover-letter') => {
//     const data = type === 'resume' ? optimization : coverLetter;
//     if (!data) return;

//     try {
//       // Convert LaTeX to PDF using the LaTeX conversion API
//       const response = await fetch('https://mynsuwuznnjqwhaurcmk.supabase.co/functions/v1/latex-convert', {
//         method: 'POST',
//         headers: {
//           'x-api-key': process.env.LATEX_CONVERT_API_KEY || '',
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           latex: data.optimized_latex
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(errorText || 'Failed to convert LaTeX to PDF');
//       }

//       const pdfData = await response.json();
      
//       // Create a blob from the base64 PDF data
//       const pdfBlob = await fetch(`data:application/pdf;base64,${pdfData.pdf}`).then(r => r.blob());
      
//       // Download the file
//       const url = URL.createObjectURL(pdfBlob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `${type}_${data.id.slice(0, 8)}.pdf`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);

//       toast.success(`${type === 'resume' ? 'Resume' : 'Cover letter'} PDF downloaded successfully!`);
//     } catch (error: any) {
//       console.error(`Error downloading ${type} PDF:`, error);
//       toast.error(error.message || `Failed to generate ${type} PDF`);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <form onSubmit={handleOptimize} className="space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="job-title">Job Title *</Label>
//             <Input
//               id="job-title"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               placeholder="e.g., Senior Software Engineer"
//               required
//             />
//           </div>
//           <div className="space-y-2">
//             <Label htmlFor="company">Company</Label>
//             <Input
//               id="company"
//               value={company}
//               onChange={(e) => setCompany(e.target.value)}
//               placeholder="e.g., Google"
//             />
//           </div>
//         </div>
//         <div className="space-y-2">
//           <Label htmlFor="description">Job Description *</Label>
//           <Textarea
//             id="description"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             placeholder="Paste the complete job description here..."
//             className="min-h-[200px]"
//             required
//           />
//         </div>
//         <Button type="submit" disabled={loading} className="w-full">
//           <Sparkles className="w-4 h-4 mr-2" />
//           {loading ? 'Optimizing...' : 'Optimize Resume'}
//         </Button>
//       </form>

//       {optimization && (
//         <div className="space-y-6">
//           <Card className="shadow-[var(--shadow-elegant)] border-primary/20">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Sparkles className="w-5 h-5 text-primary" />
//                 Resume Optimization Results
//               </CardTitle>
//               <CardDescription>
//                 ATS Score: <span className="font-bold text-accent">{optimization.ats_score}%</span>
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <h4 className="font-semibold mb-2">AI Suggestions:</h4>
//                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">
//                   {optimization.suggestions}
//                 </p>
//               </div>
//               <div>
//                 <h4 className="font-semibold mb-2">Optimized LaTeX:</h4>
//                 <Textarea
//                   value={optimization.optimized_latex}
//                   readOnly
//                   className="min-h-[300px] font-mono text-sm"
//                 />
//               </div>
//               <Button onClick={() => handleDownloadPDF('resume')} className="w-full">
//                 <Download className="w-4 h-4 mr-2" />
//                 Download Resume PDF
//               </Button>
//             </CardContent>
//           </Card>

//           {coverLetter && (
//             <Card className="shadow-[var(--shadow-elegant)] border-primary/20">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Sparkles className="w-5 h-5 text-primary" />
//                   Cover Letter Generation Results
//                 </CardTitle>
//                 <CardDescription>
//                   ATS Score: <span className="font-bold text-accent">{coverLetter.ats_score}%</span>
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div>
//                   <h4 className="font-semibold mb-2">AI Suggestions:</h4>
//                   <p className="text-sm text-muted-foreground whitespace-pre-wrap">
//                     {coverLetter.suggestions}
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Generated LaTeX:</h4>
//                   <Textarea
//                     value={coverLetter.optimized_latex}
//                     readOnly
//                     className="min-h-[300px] font-mono text-sm"
//                   />
//                 </div>
//                 <Button onClick={() => handleDownloadPDF('cover-letter')} className="w-full">
//                   <Download className="w-4 h-4 mr-2" />
//                   Download Cover Letter PDF
//                 </Button>
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
