// Quick theme test script
// Run this in the browser console to test theme switching

console.log('=== Theme Test ===');
console.log('Current data-theme:', document.documentElement.getAttribute('data-theme'));
console.log('Current localStorage theme:', localStorage.getItem('theme'));

// Test setting dark theme
console.log('\n--- Setting dark theme ---');
document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem('theme', 'dark');
console.log('After setting dark:');
console.log('  data-theme:', document.documentElement.getAttribute('data-theme'));
console.log('  bg-color:', getComputedStyle(document.body).backgroundColor);
console.log('  text-primary:', getComputedStyle(document.body).color);

// Wait 1 second then test light theme
setTimeout(() => {
    console.log('\n--- Setting light theme ---');
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    console.log('After setting light:');
    console.log('  data-theme:', document.documentElement.getAttribute('data-theme'));
    console.log('  bg-color:', getComputedStyle(document.body).backgroundColor);
    console.log('  text-primary:', getComputedStyle(document.body).color);
}, 1000);
