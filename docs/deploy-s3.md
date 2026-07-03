# Deploy blog to S3 static website

**Target:** `s3://sungkukpark.com` →  
http://sungkukpark.com.s3-website.eu-north-1.amazonaws.com

**Flow:** push to `main` → GitHub Actions builds `dist/` → `aws s3 sync` with `--delete`.

Repo metadata (`CLAUDE.md`, `.github/`, etc.) is never uploaded—only the prepared `dist/` tree.

---

## 1. S3 bucket (one time)

In **eu-north-1**, bucket name **`sungkukpark.com`**:

1. **Properties → Static website hosting:** Enable, index document `index.html`, optional error document (e.g. `404.html` later).
2. **Permissions:** Block Public Access can stay off *only if* you use a bucket policy that allows `s3:GetObject` for `arn:aws:s3:::sungkukpark.com/*` (standard public website pattern). Prefer tightening with CloudFront later.

---

## 2. IAM for GitHub Actions (OIDC, recommended)

Long-lived `AWS_ACCESS_KEY_ID` in GitHub works but rotates poorly. **OIDC** is the usual choice.

1. In AWS IAM, add **GitHub** as an identity provider (issuer `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`).
2. Create role **e.g.** `github-sungkukpark-com-deploy` trusted by that provider, condition on your repo:

   `repo:sungkukpark/sungkukpark.com:ref:refs/heads/main`

3. Attach a minimal policy, e.g.:

   - `s3:ListBucket` on `arn:aws:s3:::sungkukpark.com`
   - `s3:PutObject`, `s3:DeleteObject` on `arn:aws:s3:::sungkukpark.com/*`

4. In GitHub → **Settings → Secrets and variables → Actions**, set:

   - `AWS_ROLE_ARN` = role ARN from step 2

Workflow: [`.github/workflows/deploy-s3.yml`](../.github/workflows/deploy-s3.yml).

---

## 3. Local deploy (optional)

Same `dist/` layout as CI:

```powershell
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
New-Item -ItemType Directory dist | Out-Null
Copy-Item index.html dist/
if (Test-Path public) { Copy-Item -Recurse public\* dist\ }
if (Test-Path assets) { Copy-Item -Recurse assets dist\assets }

aws s3 sync dist/ s3://sungkukpark.com/ --delete --profile YOUR_PROFILE
```

Use a profile with the same S3 permissions as the GitHub role.

---

## 4. When you add a build (Vite + Three.js)

1. Output to `dist/` (`npm run build`).
2. In the workflow, replace the “Prepare distribution” step with `npm ci` and `npm run build`.
3. Keep syncing **`dist/`** only—never the whole repo root.

---

## 5. Custom domain & HTTPS (later)

The `s3-website` URL is HTTP only. For **https://sungkukpark.com**, put **CloudFront** in front of the bucket (or use Amplify Hosting). S3 website endpoint remains the origin; DNS points at CloudFront.
