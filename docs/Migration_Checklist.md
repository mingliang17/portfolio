# ✅ Migration Checklist

Use this checklist to migrate your portfolio to the new structure systematically.

---

## Phase 1: Setup New Structure (30 min)

### Create New Folders
```bash
mkdir -p src/assets
mkdir -p src/components/common
mkdir -p src/components/project
mkdir -p src/hooks
mkdir -p src/pages/projects
```

### Add New Files

- [ ] Create `src/assets/index.js`
  - Copy code from artifact `asset_management`
  - Update paths to match your project structure
  
- [ ] Create `src/components/common/index.jsx`
  - Copy code from artifact `common_components`
  
- [ ] Create `src/components/project/ProjectLayout.jsx`
  - Copy code from artifact `project_layout`
  
- [ ] Create `src/hooks/index.js`
  - Copy code from artifact `optimized_hooks`
  
- [ ] Create `src/constants/projectsData.js`
  - Copy code from artifact `project_constants`
  
- [ ] Create `src/styles/variables.css`
  - Copy code from artifact `css_variables`
  - Import in your main CSS file

---

## Phase 2: Update Existing Files (1 hour)

### Update `src/main.jsx`

Add import for new CSS:
```javascript
import './styles/variables.css' // Add this line
import './styles/index.css'
import './styles/mh1.css'
import './styles/navbar.css'
```

### Update `src/App.jsx`

Change import paths:
```javascript
// Old
import ProjectMH1 from "./sections/projects/ProjectMH1.jsx";

// New
import ProjectMH1 from "./pages/projects/ProjectMH1.jsx";
```

### Backup Your Old Files

```bash
# Create backup folder
mkdir -p src/backup

# Backup old files
cp src/sections/projects/ProjectMH1.jsx src/backup/
cp src/components/ProjectComponents.jsx src/backup/
cp src/hooks/useProjectAnimation.js src/backup/
```

---

## Phase 3: Migrate ProjectMH1 (1 hour)

### Step 1: Update Project Data

In `src/constants/projectsData.js`:

- [ ] Verify `PROJECT_MH1` configuration
- [ ] Check all asset paths are correct
- [ ] Verify carousel data
- [ ] Confirm metadata is complete

### Step 2: Create New ProjectMH1.jsx

- [ ] Create `src/pages/projects/ProjectMH1.jsx`
- [ ] Copy code from artifact `refactored_project_mh1`
- [ ] Update any custom logic specific to your project
- [ ] Test imports

### Step 3: Update Route

In `src/App.jsx`:
```javascript
// Update import path
import ProjectMH1 from "./pages/projects/ProjectMH1.jsx";

// Route stays the same
<Route path="/projects/MH1" element={<ProjectMH1 />} />
```

### Step 4: Test ProjectMH1

- [ ] Hero section loads correctly
- [ ] Animations work (unlock, drag, fade)
- [ ] Navigation dots appear
- [ ] Map section displays
- [ ] Carousel functions properly
- [ ] All images load
- [ ] Navbar behavior correct
- [ ] Mobile responsive

---

## Phase 4: Update Asset Imports (30 min)

### Find and Replace Old Import Pattern

Search for: `assetPath('assets/`

Replace with imports from `src/assets/index.js`

Example:
```javascript
// Old
import { assetPath } from '../utils/assetPath.js';
<img src={assetPath('assets/grid1.png')} />

// New
import { COMMON_ASSETS } from '../assets';
<img src={COMMON_ASSETS.images.grid1} />
```

### Files to Update

- [ ] `src/sections/About.jsx`
- [ ] `src/sections/Hero.jsx`
- [ ] `src/sections/Contact.jsx`
- [ ] `src/sections/Projects.jsx`
- [ ] `src/sections/Clients.jsx`
- [ ] `src/sections/Experience.jsx`
- [ ] `src/sections/Footer.jsx`
- [ ] Any other files using `assetPath`

---

## Phase 5: Test Everything (30 min)

### Functional Testing

- [ ] Home page loads
- [ ] About section works
- [ ] Projects section displays
- [ ] Contact form functional
- [ ] All navigation links work
- [ ] ProjectMH1 page functions
- [ ] All animations smooth
- [ ] No console errors

### Visual Testing

- [ ] All images load correctly
- [ ] Styles apply properly
- [ ] Colors match original
- [ ] Spacing correct
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop

### Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## Phase 6: Clean Up (30 min)

### Optional: Remove Old Files

⚠️ **Only after confirming everything works!**

```bash
# Move to backup instead of deleting
mv src/sections/projects/ProjectMH1.jsx src/backup/
mv src/components/ProjectComponents.jsx src/backup/
mv src/hooks/useProjectAnimation.js src/backup/
```

### Update Documentation

- [ ] Update README if needed
- [ ] Document any custom changes
- [ ] Note any deviations from structure

---

## Phase 7: Add Second Project (Optional - 30 min)

Follow the process in `IMPLEMENTATION_GUIDE.md`:

- [ ] Create project folder in `public/assets/projects/`
- [ ] Add images to project folder
- [ ] Register assets in `src/assets/index.js`
- [ ] Create project config in `src/constants/projectsData.js`
- [ ] Create project page using template
- [ ] Add route in `App.jsx`
- [ ] Test new project

---

## Troubleshooting Common Issues

### Issue: Assets not loading

**Solution:**
1. Check browser console for 404 errors
2. Verify paths in `src/assets/index.js`
3. Ensure `BASE_URL` correct in `vite.config.js`
4. Check file names match exactly (case-sensitive)

### Issue: Animations not working

**Solution:**
1. Check `animationPhase` in React DevTools
2. Verify hooks are imported correctly
3. Ensure event listeners are attaching
4. Check console for JavaScript errors

### Issue: Styles not applying

**Solution:**
1. Verify `variables.css` is imported
2. Check CSS import order in `main.jsx`
3. Clear browser cache
4. Check for CSS specificity conflicts

### Issue: Components not found

**Solution:**
1. Verify import paths are correct
2. Check component is exported properly
3. Ensure files are in correct folders
4. Restart dev server

---

## Success Criteria

Your migration is successful when:

✅ **All pages load without errors**
✅ **All animations work as before**
✅ **All images/assets display correctly**
✅ **Navigation functions properly**
✅ **Mobile responsive**
✅ **No console errors**
✅ **Performance is acceptable**

---

## Post-Migration Tasks

### Short-term
- [ ] Monitor for any issues
- [ ] Collect user feedback
- [ ] Fix any edge cases
- [ ] Document any customizations

### Medium-term
- [ ] Add second project using new structure
- [ ] Refine components based on usage
- [ ] Optimize performance if needed
- [ ] Add more projects

### Long-term
- [ ] Complete all 20 projects
- [ ] Implement theme switching
- [ ] Add project filtering
- [ ] Consider adding search

---

## Emergency Rollback

If something goes wrong:

1. **Don't panic!** Your original code is in `src/backup/`

2. **Restore from backup:**
   ```bash
   # Copy old files back
   cp src/backup/ProjectMH1.jsx src/sections/projects/
   cp src/backup/ProjectComponents.jsx src/components/
   
   # Update imports in App.jsx to point to old location
   ```

3. **Investigate the issue before trying again**

4. **Ask for help with specific error messages**

---

## Time Estimates

| Phase | Task | Time |
|-------|------|------|
| 1 | Setup new structure | 30 min |
| 2 | Update existing files | 1 hour |
| 3 | Migrate ProjectMH1 | 1 hour |
| 4 | Update asset imports | 30 min |
| 5 | Test everything | 30 min |
| 6 | Clean up | 30 min |
| **Total** | **Complete migration** | **4-5 hours** |

---

## Notes

- Take breaks between phases
- Test after each phase
- Don't rush - quality over speed
- Ask for help if stuck
- Document any custom changes

---

## Completion Status

Date Started: _______________

Date Completed: _______________

Issues Encountered:
- 
- 
- 

Custom Changes Made:
- 
- 
- 

---

**Ready to start? Begin with Phase 1!** 🚀