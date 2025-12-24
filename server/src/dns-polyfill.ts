import dns from 'dns';

// Force usage of IPv4 protocol where available.
// This fixes ENETUNREACH errors on platforms like Render when connecting to dual-stack services (Supabase).
try {
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder('ipv4first');
        console.log('✅ DNS resolution order set to: ipv4first');
    } else {
        console.log('ℹ️  Node version does not support setDefaultResultOrder, skipping preference.');
    }
} catch (error) {
    console.warn('⚠️  Could not set DNS resolution order:', error);
}
