const host = 't-agung.id';
const key = process.env.INDEXNOW_KEY;
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  'https://t-agung.id/', 
  'https://t-agung.id/blog/blog38_cybercab_hmi_satu_layar/', 
  'https://t-agung.id/blog/blog40_apple_iphone_duo_foldable_vs_galaxy/', 
  'https://t-agung.id/blog/blog39_xiaomi_18_fold_wide_fold_xring_o3' 
];

const body = {
  host,
  key,
  keyLocation,
  urlList
};

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});

console.log('Status:', res.status);
console.log('Response:', await res.text());