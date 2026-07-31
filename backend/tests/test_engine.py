"""Unit tests for the ASCEND progression engine."""
from datetime import date, timedelta

from app import engine


class TestXP:
    def test_xp_curve(self):
        assert engine.xp_to_next(1) == 100
        assert engine.xp_to_next(2) == round(100 * 2 ** 1.5)  # 283
        assert engine.xp_to_next(10) == round(100 * 10 ** 1.5)

    def test_apply_xp_no_level(self):
        level, xp, up = engine.apply_xp(1, 0, 50)
        assert (level, xp, up) == (1, 50, 0)

    def test_apply_xp_single_level(self):
        level, xp, up = engine.apply_xp(1, 0, 150)
        assert (level, xp, up) == (2, 50, 1)

    def test_apply_xp_multi_level(self):
        # enough XP to jump multiple levels
        level, xp, up = engine.apply_xp(1, 0, 1000)
        assert level > 3
        assert up == level - 1
        assert 0 <= xp < engine.xp_to_next(level)


class TestRanks:
    def test_rank_bands(self):
        assert engine.rank_for_level(1) == "E"
        assert engine.rank_for_level(9) == "E"
        assert engine.rank_for_level(10) == "D"
        assert engine.rank_for_level(25) == "C"
        assert engine.rank_for_level(45) == "B"
        assert engine.rank_for_level(70) == "A"
        assert engine.rank_for_level(100) == "S"
        assert engine.rank_for_level(149) == "S"

    def test_national_level_easter_egg(self):
        assert engine.rank_for_level(150) == "National Level"
        assert engine.rank_for_level(200) == "National Level"

    def test_next_rank(self):
        assert engine.next_rank("E") == "D"
        assert engine.next_rank("S") == "National Level"
        assert engine.next_rank("National Level") is None

    def test_rank_progress_bounds(self):
        assert engine.rank_progress(1, "E") == 0.0
        assert engine.rank_progress(9, "E") == 1.0
        assert engine.rank_progress(17, "D") == pytest_approx(0.5)  # (17-10)/(24-10)

    def test_suggest_dungeon_rank(self):
        assert engine.suggest_dungeon_rank(1) == "E"
        assert engine.suggest_dungeon_rank(30) == "C"
        assert engine.suggest_dungeon_rank(200) == "S"


class TestStatConversion:
    def test_str_from_volume(self):
        assert engine.str_points(100) == 1.0
        assert engine.str_points(500) == 5.0  # capped
        assert engine.str_points(1200) == 5.0

    def test_vit_from_cardio(self):
        assert engine.vit_points(0.5, 30) == 2.0
        assert engine.vit_points(1.0, 0) == 2.0

    def test_sen_from_sleep_and_streak(self):
        assert engine.sen_points(8, 10) == pytest_approx(1.2 + 0.5)
        assert engine.sen_points(5, 0) == 0.0
        assert engine.sen_points(13, 60) == pytest_approx(3.0 + 2.0)  # both capped


class TestSessionType:
    def test_classify_strength(self):
        assert engine.classify_type(["Bench Press", "Squat"]) == "strength"

    def test_classify_hiit(self):
        assert engine.classify_type(["Sprint intervals", "Tabata"]) == "hiit"

    def test_classify_cardio(self):
        assert engine.classify_type(["5km Run"]) == "cardio"

    def test_classify_mixed(self):
        assert engine.classify_type(["Frog leaps", "Bear crawl"]) == "mixed"

    def test_muscle_group(self):
        assert engine.muscle_group("Bench Press") == "Chest"
        assert engine.muscle_group("Squat") == "Legs"
        assert engine.muscle_group("Random Move") == "Other"


class TestStreaks:
    def test_empty(self):
        assert engine.compute_streaks([], date(2025, 1, 10)) == (0, 0)

    def test_current_streak_today(self):
        t = date(2025, 1, 10)
        days = [t - timedelta(days=i) for i in range(3)]
        assert engine.compute_streaks(days, t)[0] == 3

    def test_streak_alive_without_today(self):
        # yesterday had activity, today doesn't yet → streak still alive
        t = date(2025, 1, 10)
        days = [date(2025, 1, 7), date(2025, 1, 8), date(2025, 1, 9)]
        assert engine.compute_streaks(days, t)[0] == 3

    def test_broken_streak(self):
        t = date(2025, 1, 10)
        days = [date(2025, 1, 8), date(2025, 1, 9)]  # gap before the 8th; streak alive through yesterday
        assert engine.compute_streaks(days, t)[0] == 2

    def test_best_streak(self):
        t = date(2025, 1, 10)
        days = [date(2025, 1, 1), date(2025, 1, 2), date(2025, 1, 3),
                date(2025, 1, 8), date(2025, 1, 9)]
        assert engine.compute_streaks(days, t)[1] == 3


class TestUnlocks:
    def test_level_title(self):
        owned = set()
        earned = engine.missing_unlocks({"level": 10, "rank": "D", "dungeons": 0,
                                          "prs": 0, "streak": 0, "quests": 0, "volume": 0}, owned)
        names = {e["name"] for e in earned}
        assert "Iron Novice" in names
        assert "Shadow Monarch" not in names

    def test_rank_title(self):
        earned = engine.missing_unlocks({"level": 30, "rank": "C", "dungeons": 0,
                                          "prs": 0, "streak": 0, "quests": 0, "volume": 0}, set())
        names = {e["name"] for e in earned}
        assert "Elite Hunter" in names

    def test_already_owned_skipped(self):
        earned = engine.missing_unlocks({"level": 10, "rank": "D", "dungeons": 0,
                                          "prs": 0, "streak": 0, "quests": 0, "volume": 0},
                                        {"Iron Novice"})
        assert not any(e["name"] == "Iron Novice" for e in earned)

    def test_streak_badge(self):
        earned = engine.missing_unlocks({"level": 1, "rank": "E", "dungeons": 0,
                                          "prs": 0, "streak": 7, "quests": 0, "volume": 0}, set())
        assert any(e["name"] == "Persistent Hunter" for e in earned)


class TestDaily:
    def test_daily_complete(self):
        t = dict(engine.DAILY_QUEST_TARGETS)
        assert not engine.daily_complete({"pushups": 20}, t)
        assert engine.daily_complete({k: v for k, v in t.items()}, t)

    def test_daily_xp_scales(self):
        assert engine.daily_quest_xp(10) > engine.daily_quest_xp(1)


class TestDungeonXP:
    def test_rank_bonus(self):
        low = engine.dungeon_xp(0, "E", "strength", 1)
        high = engine.dungeon_xp(0, "S", "strength", 1)
        assert high > low

    def test_volume_adds_xp(self):
        more = engine.dungeon_xp(1000, "E", "strength", 1)
        less = engine.dungeon_xp(0, "E", "strength", 1)
        assert more > less


def pytest_approx(v):
    return round(v, 6)
