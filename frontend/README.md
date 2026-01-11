# Fullstack Task Management Application

A comprehensive fullstack task management application with time tracking capabilities, built with React and featuring a RESTful backend API.

> **Note:** Only the frontend part of this repository is my work, I did NOT author the backend.

## Overview

This application provides a complete task management solution that allows users to:
- Create, edit, and delete tasks
- Organize tasks with customizable tags
- Track active/inactive task status with timestamps
- Filter tasks by multiple tags
- View task statistics and time analytics

## Project Structure

```
fullstack_final_assignment/
├── backend/           # Backend server (Node.js/Express)
│   ├── server.js     # Main server file
│   ├── package.json  # Backend dependencies
│   └── README.md     # Backend documentation
├── frontend/          # React + Vite frontend application
│   ├── src/
│   │   ├── App.jsx   # Main application with routing and components
│   │   ├── App.css   # Application styles
│   │   ├── main.jsx  # Application entry point
│   │   └── index.css # Global styles
│   ├── public/        # Static assets
│   ├── index.html    # HTML entry point
│   ├── vite.config.js # Vite configuration
│   ├── eslint.config.js # ESLint configuration
│   └── package.json   # Frontend dependencies
└── README.md          # Project documentation
```

## Features

### Task Management
- **Create Tasks**: Add new tasks with names
- **Edit Tasks**: Modify task names inline
- **Delete Tasks**: Remove tasks with confirmation
- **Tag Assignment**: Assign multiple tags to each task
- **Task Filtering**: Filter tasks by one or more tags

### Time Tracking
- **Start/Stop Tracking**: Toggle task activity status
- **Timestamp Logging**: Records start and stop events for each task
- **Active Status**: Visual indicator showing which tasks are currently active
- **Time Statistics**: View total time spent on tasks

### Tag Management
- **Create Tags**: Add custom tags for organizing tasks
- **Delete Tags**: Remove tags (automatically updates all associated tasks)
- **Filter by Tags**: Use tags to filter the task list

### Statistics Dashboard
- Visual representation of task data using charts
- Time tracking analytics
- Task completion metrics

## Technology Stack

### Frontend
- **React 19.1.1**: UI framework
- **React Router DOM 7.9.4**: Client-side routing
- **Vite 7.1.7**: Build tool and development server
- **Recharts 3.3.0**: Data visualization library
- **ESLint**: Code linting and quality

### Backend
- RESTful API server (port 3010)
- Endpoints for tasks, tags, and timestamps
- **Note**: The backend server is not authored by me. Please refer to the README file in the backend directory for detailed information about the backend implementation and setup.

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Usage

### Managing Tasks
1. Enter a task name in the input field on the Home page
2. Click "Add Task" to create the task
3. Click the edit icon to modify a task name
4. Click the delete icon to remove a task
5. Use checkboxes to assign tags to tasks

### Time Tracking
1. Click the "Start" button to begin tracking time for a task
2. The button changes to "Stop" when a task is active
3. Click "Stop" to end the time tracking session
4. Active tasks are visually indicated in the interface

### Filtering Tasks
1. Select one or more tags from the filter section
2. Only tasks with ALL selected tags will be displayed
3. Click "Clear Filters" to show all tasks again

### Viewing Statistics
1. Navigate to the Statistics page using the navigation menu
2. View charts and analytics about your tasks and time tracking

## Contributing

Issues, feature requests and contributions are all welcome

## License

This project is licensed under the MIT License.

## Author

Frontend developed by [ThatGuyAlecc](https://github.com/ThatGuyAlecc)