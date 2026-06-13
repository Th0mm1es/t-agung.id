const host = 't-agung.id';
const key = process.env.INDEXNOW_KEY;
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  'https://t-agung.id/',
  'https://t-agung.id/about_me',
  'https://t-agung.id/blog/blog_01_my-first-post/',
  'https://t-agung.id/blog/blog_02_display_params_disalahpahami/',
  'https://t-agung.id/blog/blog_03_lcd_oled_microled_hmi/',
  'https://t-agung.id/blog/blog_05_display_stackup_part2_focus_polarizer/,
  'https://t-agung.id/blog/blog_06_display_stackup_part3_lc_touch_oled/',
  'https://t-agung.id/blog/blog_07_grade_differences/,
  'https://t-agung.id/blog/blog_08_resolusi_layar_bedanya_apa/',
  'https://t-agung.id/blog/blog_09_mini_led_revolution/',
  'https://t-agung.id/blog/blog_10_mini_led_itu_apa/',
  'https://t-agung.id/blog/blog_11_hp_lipat_crease/',
  'https://t-agung.id/blog/blog_12_computex2026/',
  'https://t-agung.id/blog/blog13_computex_2026_breakthrough/',
  'https://t-agung.id/blog/blog14_wwdc2026_apple_intelligence_npu/',
  'https://t-agung.id/blog/blog15_sid_display_tech_breakthrough/',  
  'https://t-agung.id/blog/blog16_macbook_ultra_hybrid_oled/'
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