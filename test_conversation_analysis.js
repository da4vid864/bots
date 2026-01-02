/**
 * Test script for Conversation Analysis Services
 * Validates the core analysis services without database
 */

import { classifyIntent } from './services/intentClassificationService.js';
import { extractProducts } from './services/productExtractionService.js';
import { calculateInterestScore } from './services/interestScoringService.js';
import { predictStage } from './services/stagePredictionService.js';
import { generateFollowupRecommendations } from './services/followupService.js';

// Test conversation data
const testConversations = [
    {
        name: "Purchase Intent",
        messages: [
            { direction: 'inbound', type: 'text', content: 'Hola, me interesa comprar uno de sus productos', timestamp: new Date() },
            { direction: 'outbound', type: 'text', content: 'Claro, ¿qué producto te interesa?', timestamp: new Date() },
            { direction: 'inbound', type: 'text', content: 'Quiero saber el precio del software de gestión', timestamp: new Date() },
            { direction: 'inbound', type: 'text', content: '¿Cuánto cuesta? ¿Tienen descuento?', timestamp: new Date() }
        ]
    },
    {
        name: "Information Request",
        messages: [
            { direction: 'inbound', type: 'text', content: 'Buenos días, quería información sobre sus servicios', timestamp: new Date() },
            { direction: 'outbound', type: 'text', content: 'Claro, ¿qué tipo de servicio busca?', timestamp: new Date() },
            { direction: 'inbound', type: 'text', content: '¿Cómo funciona la implementación?', timestamp: new Date() }
        ]
    },
    {
        name: "Support Issue",
        messages: [
            { direction: 'inbound', type: 'text', content: 'Hola, tengo un problema con mi cuenta', timestamp: new Date() },
            { direction: 'inbound', type: 'text', content: 'No puedo acceder al sistema, me sale un error', timestamp: new Date() }
        ]
    }
];

function aggregateConversationData(messages) {
    const inboundMessages = messages.filter(m => m.direction === 'inbound');
    const allText = messages.filter(m => m.type === 'text').map(m => m.content).join(' ');
    const lowerText = allText.toLowerCase();
    
    return {
        totalMessages: messages.length,
        inboundCount: inboundMessages.length,
        outboundCount: messages.length - inboundMessages.length,
        conversationLength: allText.length,
        uniqueContactDays: 1,
        firstMessageAt: messages[0]?.timestamp,
        lastMessageAt: messages[messages.length - 1]?.timestamp,
        allText,
        hasQuestions: allText.includes('?') || lowerText.includes('como') || lowerText.includes('cuanto'),
        hasPriceInquiry: lowerText.includes('precio') || lowerText.includes('costo')
    };
}

function runTests() {
    console.log('=== Conversation Analysis Services Test ===\n');
    
    for (const testCase of testConversations) {
        console.log(`\n--- Test: ${testCase.name} ---`);
        
        const conversationData = aggregateConversationData(testCase.messages);
        const intentResult = classifyIntent(conversationData);
        const productResult = extractProducts(conversationData);
        const interestResult = calculateInterestScore(conversationData, intentResult, productResult);
        const stageResult = predictStage(conversationData, intentResult, interestResult);
        const followupResult = generateFollowupRecommendations(conversationData, interestResult, stageResult);
        
        console.log(`Intent: ${intentResult.primary} (${(intentResult.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`Interest Score: ${interestResult.score}/100`);
        console.log(`Predicted Stage: ${stageResult.stage} (${(stageResult.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`Follow-up Priority: ${followupResult.priority}`);
        console.log(`Actions: ${followupResult.actions.join(', ')}`);
        
        if (productResult.products.length > 0) {
            console.log(`Products: ${productResult.products.map(p => p.name).join(', ')}`);
        }
        if (productResult.priceInquiries.length > 0) {
            console.log(`Price Inquiries: ${productResult.priceInquiries.join(', ')}`);
        }
    }
    
    console.log('\n=== All Tests Completed ===');
}

runTests();
