import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { LocationStrategy, HashLocationStrategy, APP_BASE_HREF } from '@angular/common';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { 
      provide: APP_BASE_HREF, 
      useFactory: () => {
        // Dynamically calculate base based on current location to support subdirectories (like GitHub Pages)
        const path = window.location.pathname;
        return path.endsWith('/') ? path : path + '/';
      }
    }
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
