export async function addDomainToCloudflare(domain: string) {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const workerName = "skteamgoldgalleri"; // اسم ورکر شما در wrangler.toml

  if (!apiToken || !accountId) {
    console.warn("Cloudflare credentials missing. Skipping domain addition.");
    return { success: false, error: "توکن کلودفلر تنظیم نشده است." };
  }

  try {
    // 1. پیدا کردن Zone ID بر اساس دامنه اصلی
    const domainParts = domain.split('.');
    const rootDomain = domainParts.slice(-2).join('.'); // استخراج دامنه اصلی
    
    const zonesRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${rootDomain}`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    });
    const zonesData = await zonesRes.json();
    
    if (!zonesData.success || zonesData.result.length === 0) {
      return { success: false, error: "Zone ID در کلودفلر پیدا نشد." };
    }
    const zoneId = zonesData.result[0].id;

    // 2. اضافه کردن دامنه به Worker
    const attachRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/domains`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        hostname: domain,
        service: workerName,
        environment: "production"
      })
    });

    const attachData = await attachRes.json();
    
    if (!attachData.success) {
      return { success: false, error: attachData.errors?.[0]?.message || "خطا در اتصال دامنه به ورکر." };
    }

    return { success: true };
  } catch (error) {
    console.error("Cloudflare API Error:", error);
    return { success: false, error: "خطای شبکه در اتصال به کلودفلر." };
  }
}
