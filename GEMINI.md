(venv) PS C:\Projects\AI-Rez-gen\latex-ai-writer-v2> git push origin main
Enumerating objects: 7, done.
Counting objects: 100% (7/7), done.
Delta compression using up to 12 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (4/4), 923 bytes | 923.00 KiB/s, done.
Total 4 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (1/1), completed with 1 local object.
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: 
remote: - GITHUB PUSH PROTECTION
remote:   —————————————————————————————————————————
remote:     Resolve the following violations before pushing again
remote:
remote:     - Push cannot contain secrets
remote:
remote:
remote:      (?) Learn how to resolve a blocked push
remote:      https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-from-the-command-line#resolving-a-blocked-push
remote:
remote:      (?) This repository does not have Secret Scanning enabled, but is eligible. Enable Secret Scanning to view and manage detected secrets. 
remote:      Visit the repository settings page, https://github.com/MalanSathya/latex-ai-writer-v2/settings/security_analysis
remote:
remote:
remote:       —— OpenAI API Key ————————————————————————————————————
remote:        locations:
remote:          - commit: 6e5f68c89c6723afe89e3f6d86770e2a6a2d7202
remote:            path: .env:6
remote:
remote:        (?) To push, remove secret from commit(s) or follow this URL to allow the secret.
remote:        https://github.com/MalanSathya/latex-ai-writer-v2/security/secret-scanning/unblock-secret/34Qs2300IwA3Dixf6x56oTyHUp1
remote:
remote:
remote:
To https://github.com/MalanSathya/latex-ai-writer-v2
 ! [remote rejected] main -> main (push declined due to repository rule violations)
error: failed to push some refs to 'https://github.com/MalanSathya/latex-ai-writer-v2'