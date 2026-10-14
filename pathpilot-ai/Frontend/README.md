# PathPilot AI Frontend Authentication

The frontend uses Supabase Auth for email/password authentication. Configure
only these public browser variables in `Frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```
