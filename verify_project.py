import os

REQUIRED_FILES = [
    # Backend configs & server
    "backend/package.json",
    "backend/.env.example",
    "backend/.env",
    "backend/src/app.js",
    "backend/src/server.js",
    "backend/src/config/db.js",
    
    # Backend Models
    "backend/src/models/User.js",
    "backend/src/models/Post.js",
    "backend/src/models/Comment.js",
    "backend/src/models/Follow.js",
    "backend/src/models/Story.js",
    "backend/src/models/Message.js",
    "backend/src/models/Notification.js",
    
    # Backend Controllers
    "backend/src/controllers/authController.js",
    "backend/src/controllers/userController.js",
    "backend/src/controllers/postController.js",
    "backend/src/controllers/commentController.js",
    "backend/src/controllers/followController.js",
    "backend/src/controllers/storyController.js",
    "backend/src/controllers/messageController.js",
    "backend/src/controllers/notificationController.js",
    
    # Backend Routes
    "backend/src/routes/authRoutes.js",
    "backend/src/routes/userRoutes.js",
    "backend/src/routes/postRoutes.js",
    "backend/src/routes/commentRoutes.js",
    "backend/src/routes/followRoutes.js",
    "backend/src/routes/storyRoutes.js",
    "backend/src/routes/messageRoutes.js",
    "backend/src/routes/notificationRoutes.js",
    
    # Backend Middlewares & Utils
    "backend/src/middlewares/authMiddleware.js",
    "backend/src/middlewares/uploadMiddleware.js",
    "backend/src/utils/generateToken.js",
    "backend/src/utils/seed.js",
    
    # Frontend Configs
    "frontend/package.json",
    "frontend/vite.config.js",
    "frontend/tailwind.config.js",
    "frontend/postcss.config.js",
    "frontend/index.html",
    
    # Frontend Context & Services
    "frontend/src/context/AuthContext.jsx",
    "frontend/src/context/SocketContext.jsx",
    "frontend/src/services/api.js",
    
    # Frontend Pages
    "frontend/src/pages/AuthPage.jsx",
    "frontend/src/pages/FeedPage.jsx",
    "frontend/src/pages/ExplorePage.jsx",
    "frontend/src/pages/ProfilePage.jsx",
    "frontend/src/pages/DirectMessagePage.jsx",
    
    # Frontend Components
    "frontend/src/components/Sidebar.jsx",
    "frontend/src/components/BottomNav.jsx",
    "frontend/src/components/CreatePostModal.jsx",
    "frontend/src/components/StoryViewerModal.jsx",
    "frontend/src/components/PostCard.jsx",
    "frontend/src/components/SearchSlider.jsx",
    "frontend/src/components/NotificationSlider.jsx",
    
    # React Entry Points
    "frontend/src/main.jsx",
    "frontend/src/App.jsx",
    "frontend/src/index.css"
]

def verify_files():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    all_passed = True
    missing_files = []
    
    print("\n==============================================")
    print("      OrySnap Project Verification Script      ")
    print("==============================================\n")
    
    for relative_path in REQUIRED_FILES:
        full_path = os.path.join(base_dir, relative_path)
        # Normalize for Windows compatibility
        full_path = os.path.normpath(full_path)
        
        if os.path.exists(full_path):
            file_size = os.path.getsize(full_path)
            if file_size > 0:
                print(f"[ OK ] {relative_path} - Found ({file_size} bytes)")
            else:
                print(f"[EMPTY] {relative_path} - File is EMPTY!")
                all_passed = False
        else:
            print(f"[MISSING] {relative_path} - MISSING!")
            all_passed = False
            missing_files.append(relative_path)
            
    print("\n==============================================")
    if all_passed:
        print(" SUCCESS: All files created and verified! ")
    else:
        print(f" FAILURE: {len(missing_files)} files are missing or empty! ")
        print("Missing files:", missing_files)
    print("==============================================\n")

if __name__ == "__main__":
    verify_files()
