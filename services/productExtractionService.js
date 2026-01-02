/**
 * Product Extraction Service
 * Extracts products and services mentioned in conversations
 * 
 * Phase 1: Core Analysis Engine
 */

const PRODUCT_CATEGORIES = {
    digital: {
        keywords: ['software', 'app', 'aplicacion', 'sistema', 'plataforma', 'saas',
                   'curso', 'curso online', 'capacitacion', 'training', 'certificacion',
                   'digital', 'online', 'web', 'cloud']
    },
    physical: {
        keywords: ['producto', 'mercancia', 'inventario', 'stock', 'articulo',
                   'pieza', 'unidad', 'item', 'goods', 'merchandise']
    },
    services: {
        keywords: ['servicio', 'consultoria', 'asesoria', 'implementacion',
                   'mantenimiento', 'soporte tecnico', 'outsourcing']
    },
    subscription: {
        keywords: ['planes', 'paquetes', 'membresia', 'suscripcion', 'plan',
                   'package', 'subscription', 'membership', 'premium']
    }
};

const PRICE_PATTERNS = [
    /precio[s]?\s*(de|del|para)?\s*(\w+)?/gi,
    /cuanto[s]?\s*(cuesta|vales?|es)?/gi,
    /costo[s]?\s*(de|del)?/gi,
    /\$\s*[\d,]+(?:\.\d{2})?/g,
    /[\d,]+(?:\.\d{2})?\s*(pesos?|mxn|usd|dollars?|eur|€)/gi
];

export function extractProducts(conversationData) {
    const { allText } = conversationData;
    const lowerText = allText.toLowerCase();
    
    const products = [];
    const services = [];
    const priceInquiries = [];
    const categories = {};
    
    for (const [category, config] of Object.entries(PRODUCT_CATEGORIES)) {
        const items = [];
        for (const keyword of config.keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                items.push({
                    name: keyword,
                    mentionCount: matches.length,
                    category: category,
                    context: extractContext(allText, keyword)
                });
            }
        }
        categories[category] = items;
        if (['services', 'subscription'].includes(category)) {
            services.push(...items);
        } else {
            products.push(...items);
        }
    }
    
    for (const pattern of PRICE_PATTERNS) {
        const matches = allText.match(pattern);
        if (matches) {
            for (const match of matches) {
                priceInquiries.push({ text: match.trim(), type: detectPriceType(match) });
            }
        }
    }
    
    const rankAndDedup = (items) => {
        const grouped = {};
        for (const item of items) {
            const key = item.name.toLowerCase();
            if (!grouped[key]) grouped[key] = { ...item, name: item.name };
            else grouped[key].mentionCount += item.mentionCount;
        }
        return Object.values(grouped).sort((a, b) => b.mentionCount - a.mentionCount).slice(0, 10);
    };
    
    return {
        products: rankAndDedup(products),
        services: rankAndDedup(services),
        priceInquiries: [...new Set(priceInquiries.map(p => p.text))].slice(0, 5),
        categories
    };
}

function extractContext(text, keyword, windowSize = 50) {
    const regex = new RegExp(`.{0,${windowSize}}\\b${keyword}\\b.{0,${windowSize}}`, 'gi');
    const match = regex.exec(text);
    return match ? '...' + match[0].trim() + '...' : null;
}

function detectPriceType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('precio') || lower.includes('price')) return 'price_inquiry';
    if (lower.includes('costo') || lower.includes('cost')) return 'cost_inquiry';
    if (/\$|mxn|usd|eur|€/.test(text)) return 'specific_amount';
    return 'general_inquiry';
}

export default { extractProducts };
