// === API & DATA LAYER MODULE ===

export const API_BASE_URL = "https://painel-atomic.onrender.com/api";
export const API_ANALYTICS_URL = `${API_BASE_URL}/public/visit`;
export const API_ORDER_URL = `${API_BASE_URL}/public/order`;

/**
 * Envia métricas para o Painel Administrativo
 */
export const trackAtomicEvent = (type) => {
    if (type === 'visit') {
        if (sessionStorage.getItem('atomic_visited')) return;
        sessionStorage.setItem('atomic_visited', 'true');
    }

    fetch(API_ANALYTICS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        keepalive: true
    }).catch(err => console.warn('[Atomic Analytics] Error:', err));
};

/**
 * DATA LAYER: Função de Preparação e Serialização
 */
export function prepareBudgetForPanel(payload) {
    if (!payload.schema_version || !payload.data) {
        console.error("[Atomic Data Layer] Invalid Payload Schema");
        return;
    }
    
    // Log de Auditoria (Data Layer Output)
    console.groupCollapsed(`🚀 [Atomic Data Layer] Event: ${payload.event_id}`);
    console.log("Time:", payload.timestamp);
    console.log("Schema:", payload.schema_version);
    console.log("Customer:", payload.data.customer.name);
    console.log("Value:", `${payload.data.financial.min_value} - ${payload.data.financial.max_value}`);
    console.log("Full Payload:", payload);
    console.groupEnd();
}

/**
 * Envio de Pedidos/Leads para API
 */
export function submitOrderToAPI(orderData) {
    return fetch(API_ORDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        keepalive: true 
    }).catch(e => console.error("Erro ao salvar pedido (keepalive)", e));
}
