// === API & DATA LAYER MODULE ===

export const API_BASE_URL = "https://painel-atomic.onrender.com/api";
export const API_ANALYTICS_URL = `${API_BASE_URL}/public/visit`;
export const API_ORDER_URL = `${API_BASE_URL}/public/order`;

export const trackAtomicEvent = (type) => {
    try {
        if (type === 'visit') {
            if (sessionStorage.getItem('atomic_visited')) return;
            sessionStorage.setItem('atomic_visited', 'true');
        }
        // Use sendBeacon if available for better reliability on unload, otherwise fetch
        if (navigator.sendBeacon) {
            navigator.sendBeacon(API_ANALYTICS_URL, JSON.stringify({ type }));
        } else {
            fetch(API_ANALYTICS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
                keepalive: true
            }).catch(e => console.warn('Analytics API Error', e));
        }
    } catch (e) {
        console.warn('Analytics skipped');
    }
};

export function prepareBudgetForPanel(payload) {
    if (!payload.schema_version || !payload.data) {
        console.error("[Atomic Data Layer] Invalid Payload");
        return;
    }
    // Debug log only
    console.log(`[Atomic Order] Event: ${payload.event_id}`, payload.data);
}

export function submitOrderToAPI(orderData) {
    return fetch(API_ORDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        keepalive: true 
    }).catch(e => console.error("Order Submit Error", e));
}
