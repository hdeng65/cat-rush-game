// Database operations — all Supabase calls with offline fallback.

function sanitizePlayerName(name) {
    // Strip HTML tags
    let clean = name.replace(/<[^>]*>/g, '');
    // Trim whitespace
    clean = clean.trim();
    // Allow letters, numbers, spaces, and emoji only
    // This regex keeps word chars, spaces, and unicode emoji/symbols
    clean = clean.replace(/[^\w\sÀ-ɏἀ-῿☀-➿\u{1F300}-\u{1FFFF}]/gu, '');
    // Truncate to 12 characters
    clean = [...clean].slice(0, 12).join('');
    return clean;
}

function isValidPlayerName(name) {
    const clean = sanitizePlayerName(name);
    return clean.length > 0;
}

async function submitScore({ playerName, score, coinsEarned, levelReached }) {
    const cleanName = sanitizePlayerName(playerName);
    if (!cleanName) throw new Error('Invalid player name');

    const sessionId = getSessionId();
    const sb = getSupabase();

    if (sb) {
        const { error } = await sb.from('scores').insert({
            player_name: cleanName,
            score: score,
            coins_total: coinsEarned,
            level_reached: levelReached,
            session_id: sessionId
        });
        if (error) {
            console.error('Supabase insert error:', error);
            // Save locally as fallback, but still report the error
            saveLocalScore({ playerName: cleanName, score, coinsEarned, levelReached });
            throw new Error(error.message || 'Database error');
        }
        await updateCoins(coinsEarned);
    } else {
        saveLocalScore({ playerName: cleanName, score, coinsEarned, levelReached });
    }
}

async function getLeaderboard() {
    const sb = getSupabase();
    if (sb) {
        try {
            const { data, error } = await sb
                .from('scores')
                .select('player_name, score, coins_total, level_reached')
                .order('score', { ascending: false })
                .limit(10);
            if (error) throw error;
            return data || [];
        } catch (e) {
            return getLocalLeaderboard();
        }
    }
    return getLocalLeaderboard();
}

async function getPersonalBest() {
    const sessionId = getSessionId();
    const sb = getSupabase();

    if (sb) {
        try {
            const { data, error } = await sb
                .from('scores')
                .select('player_name, score, coins_total, level_reached')
                .eq('session_id', sessionId)
                .order('score', { ascending: false })
                .limit(1);
            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (e) {
            return getLocalPersonalBest();
        }
    }
    return getLocalPersonalBest();
}

async function getCoins() {
    const sessionId = getSessionId();
    const sb = getSupabase();

    if (sb) {
        try {
            const { data, error } = await sb
                .from('sessions')
                .select('coins')
                .eq('session_id', sessionId)
                .single();
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data ? data.coins : 0;
        } catch (e) {
            return getLocalCoins();
        }
    }
    return getLocalCoins();
}

async function updateCoins(amount) {
    const sessionId = getSessionId();
    const sb = getSupabase();

    if (sb) {
        try {
            // Try to get current balance
            const { data: existing } = await sb
                .from('sessions')
                .select('coins')
                .eq('session_id', sessionId)
                .single();

            if (existing) {
                const { error } = await sb
                    .from('sessions')
                    .update({ coins: existing.coins + amount, updated_at: new Date().toISOString() })
                    .eq('session_id', sessionId);
                if (error) throw error;
            } else {
                const { error } = await sb
                    .from('sessions')
                    .insert({ session_id: sessionId, coins: amount });
                if (error) throw error;
            }
        } catch (e) {
            addLocalCoins(amount);
        }
    } else {
        addLocalCoins(amount);
    }
}

// --- localStorage fallbacks ---

function saveLocalScore({ playerName, score, coinsEarned, levelReached }) {
    const scores = JSON.parse(localStorage.getItem('catRushScores') || '[]');
    scores.push({ player_name: playerName, score, coins_total: coinsEarned, level_reached: levelReached });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('catRushScores', JSON.stringify(scores.slice(0, 50)));
    addLocalCoins(coinsEarned);
}

function getLocalLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('catRushScores') || '[]');
    return scores.slice(0, 10);
}

function getLocalPersonalBest() {
    const scores = JSON.parse(localStorage.getItem('catRushScores') || '[]');
    return scores.length > 0 ? scores[0] : null;
}

function getLocalCoins() {
    return parseInt(localStorage.getItem('catRushCoins') || '0', 10);
}

function addLocalCoins(amount) {
    const current = getLocalCoins();
    localStorage.setItem('catRushCoins', (current + amount).toString());
}
