/**
 * 🍺 Choppinho Fit - Weekly Stats & Choppe Calculator
 * 
 * Este script contém a lógica central que deve ser replicada no n8n
 * para gerar o ranking de sexta-feira às 12:00.
 */

const CALORIES_PER_CHOPPE = 130;
const MAX_CHOPES_PER_WEEK = 5;

/**
 * Calcula a quantidade de chopes liberados com base nas calorias.
 * @param {number} totalCalories - Soma das calorias da semana.
 * @returns {number} - Quantidade de chopes (0 a 5).
 */
function calculateChopes(totalCalories) {
    if (!totalCalories || totalCalories <= 0) return 0;

    const rawChopes = Math.floor(totalCalories / CALORIES_PER_CHOPPE);
    return Math.min(rawChopes, MAX_CHOPES_PER_WEEK);
}

/**
 * Processa a lista de atividades e usuários para gerar o ranking.
 * @param {Array} users - Lista de usuários ativos do Supabase.
 * @param {Array} activities - Lista de atividades da semana (Seg 00:00 -> Sex 11:59).
 * @returns {Array} - Ranking ordenado.
 */
function generateRanking(users, activities) {
    // 1. Agrupar calorias e km por usuário
    const userStats = {};

    users.forEach(user => {
        userStats[user.id] = {
            name: user.first_name || user.wa_name || 'Atleta Anonimo',
            totalCalories: 0,
            totalKm: 0,
            runCount: 0,
            personality: user.personality_mode || 'default'
        };
    });

    activities.forEach(activity => {
        if (userStats[activity.user_id]) {
            userStats[activity.user_id].totalCalories += (activity.calories || 0);
            userStats[activity.user_id].totalKm += (activity.distance_meters || 0) / 1000;
            userStats[activity.user_id].runCount += 1;
        }
    });

    // 2. Calcular chopes e formatar objeto final
    const ranking = Object.keys(userStats).map(userId => {
        const stats = userStats[userId];
        return {
            userId,
            name: stats.name,
            totalKm: parseFloat(stats.totalKm.toFixed(2)),
            totalCalories: stats.totalCalories,
            chopes: calculateChopes(stats.totalCalories),
            runCount: stats.runCount,
            personality: stats.personality
        };
    });

    // 3. Ordenar: Chopes (DESC), depois KM (DESC)
    return ranking.sort((a, b) => {
        if (b.chopes !== a.chopes) return b.chopes - a.chopes;
        return b.totalKm - a.totalKm;
    });
}

// Exemplo de uso para teste local:
const mockUsers = [
    { id: '1', first_name: 'João', personality_mode: 'offensive' },
    { id: '2', first_name: 'Victor', personality_mode: 'default' },
    { id: '3', first_name: 'Rafael', personality_mode: 'light_zen' }
];

const mockActivities = [
    { user_id: '1', calories: 1500, distance_meters: 25000 },
    { user_id: '1', calories: 1200, distance_meters: 20000 },
    { user_id: '2', calories: 800, distance_meters: 12000 },
    { user_id: '3', calories: 200, distance_meters: 3000 }
];

const finalRanking = generateRanking(mockUsers, mockActivities);

console.log('--- RANKING SEMANAL CHOPPINHO FIT ---');
finalRanking.forEach((item, index) => {
    console.log(`${index + 1}º ${item.name} - ${item.chopes} chopes (${item.totalKm}km, ${item.totalCalories}kcal) [Modo: ${item.personality}]`);
});

module.exports = { calculateChopes, generateRanking };
