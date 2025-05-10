# Weekly Announcement Composer

A React-based web application for creating and managing weekly announcements in multiple languages (English and Chinese). The application allows users to create, edit, and export formatted announcements with verses and messages for each day of the week.

## Features

- Dual-language support (English and Chinese)
- Weekly date-based announcement planning
- Bible verse reference and text input
- Daily messages/announcements for each day
- Summary section for important notices
- Export to PDF in a nicely formatted layout
- Persistent storage using localStorage
- Responsive design with Tailwind CSS

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Key Components

- **DatePicker**: Select the starting Sunday date for the week
- **TitleLine**: Manages the title of the announcement document
- **VerseSection**: Handles verse references, text, and daily messages
- **SummaryBox**: Allows input of summary information
- **ExportButtons**: Provides PDF export functionality with pdfmake
- **Redux Store**: Manages application state with Redux Toolkit

## Technologies Used

- React 18
- Redux Toolkit for state management
- Tailwind CSS for styling
- Moment.js for date handling
- PDFMake for PDF generation
- Vite for development and building

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t mr-editor .

# Run the container
docker run -p 3000:3000 mr-editor
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ for our communities.
