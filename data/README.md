# Homepage Random Data Files

This folder contains text files that control which clubs and players appear in the "Random Teams" and "Random Players" sections on the homepage.

---

## 📁 File Structure

- **`clubs.txt`** - List of club IDs (one per line)
- **`players.txt`** - List of player entries (one per line)

---

## ⚙️ How It Works

The homepage reads these files every hour and displays **5 random items** from each list.

- **Randomization:** Based on the current hour, so the same items appear for the full hour
- **Refresh:** Automatically updates every hour without manual intervention
- **Cache:** Next.js ISR caches the page for 1 hour (3600 seconds)

---

## 📝 Updating Clubs (`clubs.txt`)

Add club IDs, one per line:

```
47545
14726
3921
22838
```

**Format:**
- One club ID per line
- No spaces or extra characters
- Blank lines are ignored

**Where to find club IDs:**
- Search for a club on proclubs.io
- The URL will be: `/club/[clubId]?platform=common-gen5`
- Copy the numeric ID

---

## 📝 Updating Players (`players.txt`)

Add player entries, one per line, in the format: `clubId/playerName`

```
47545/Z-3POx
14726/PlayerName
3921/JohnDoe
```

**Supported Formats:**

1. **Simple format (recommended):**
   ```
   47545/Z-3POx
   ```

2. **With query params:**
   ```
   47545/Z-3POx?platform=common-gen5
   ```

3. **Full URL path:**
   ```
   /player/47545/Z-3POx?platform=common-gen5
   ```

**Format Rules:**
- One player per line
- Must include both `clubId` and `playerName` separated by `/`
- Player names with spaces work fine: `47545/John Doe`
- Blank lines are ignored

**Where to find player info:**
1. Go to a club page
2. Click on a player
3. The URL will be: `/player/[clubId]/[playerName]?platform=common-gen5`
4. Copy in the format: `clubId/playerName`

---

## 🔄 Applying Changes

After editing the text files:

1. **Development:** Changes appear on next page refresh (Next.js will recompile)
2. **Production:** Changes appear within 1 hour (or force rebuild)

### Manual Refresh (Production)

If you want changes to appear immediately in production:

```bash
# Rebuild the site
npm run build
npm start
```

Or use your hosting platform's rebuild trigger.

---

## 💡 Tips

- **Add more items** for better variety (at least 10+ of each)
- **Remove inactive clubs/players** to keep content fresh
- **Test club IDs** before adding (visit the club page to verify it exists)
- **No duplicates needed** - the system automatically handles random selection

---

## 📊 Current Setup

- **Clubs:** 20 club IDs
- **Players:** 10 player entries
- **Display:** 5 random from each list per hour

---

## ❓ Troubleshooting

**Problem:** "No clubs available" or "No players available" appears

**Solutions:**
1. Check that the text file exists in the `data/` folder
2. Verify file formatting (one entry per line)
3. Check the server console for errors
4. Ensure club IDs are valid numbers
5. Ensure player format is `clubId/playerName`

**Problem:** Same items always appear

**Solution:** This is expected behavior! Items stay the same for the full hour, then shuffle at the next hour boundary (e.g., 2:00 PM → 3:00 PM).

---

## 🎨 Example Files

### `clubs.txt`
```
47545
14726
3921
22838
31156
41927
19284
52341
8765
36492
```

### `players.txt`
```
47545/Z-3POx
14726/Bradmaaan
3921/JohnDoe
22838/ProPlayer
31156/Striker99
41927/Midfielder
19284/Defender1
52341/GoalKeeper
8765/Winger
36492/Forward
```

---

**Last Updated:** October 24, 2025
