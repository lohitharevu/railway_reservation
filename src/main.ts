
/// <reference types="@angular/localize" />
import { Component, signal, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  Router,
  RouterOutlet,
  Routes,
  CanActivateFn,
  NavigationEnd,
} from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { filter } from 'rxjs';

const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return localStorage.getItem('currentUser')
    ? true
    : router.createUrlTree(['/login']);
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}

@Component({
  selector: 'app-railway',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <header class="navbar">
      <div class="brand">🚆 Rail<span>Connect</span></div>

      <nav>
        <a (click)="go('/')">{{t().home}}</a>
        <a (click)="go('/search')">{{t().search}}</a>
        <a (click)="go('/my-bookings')">{{t().bookings}}</a>
        <a (click)="go('/pnr-status')">{{t().pnrStatus}}</a>
      </nav>

      <div class="nav-right">
        <select [value]="language" (change)="changeLanguage($event)">
          <option value="en">English</option>
          <option value="te">తెలుగు</option>
          <option value="hi">हिन्दी</option>
        </select>

        @if (loggedIn()) {
          <button class="login-btn" (click)="logout()">
            {{t().logout}}
          </button>
        } @else {
          <button class="login-btn" (click)="go('/login')">
            {{t().login}}
          </button>
          <button class="login-btn" (click)="go('/register')">
            {{t().register}}
          </button>
        }
      </div>
    </header>

    @if (page() === 'home' || page() === 'search') {
      <section class="hero">
        <div class="hero-content">
          <p class="tag">{{t().tagline}}</p>
          <h1>{{t().heading}}</h1>
          <p class="subtitle">{{t().subtitle}}</p>

          <div class="search-card">
            <h2>🔎 {{t().search}}</h2>

            <form [formGroup]="searchForm" (ngSubmit)="searchTrains()">
              <div class="search-grid">
                <div>
                  <label>{{t().from}}</label>
                  <select formControlName="from">
                    <option value="">{{t().selectSource}}</option>
                    @for (s of stations; track s) {
                      <option [value]="s">{{s}}</option>
                    }
                  </select>
                </div>

                <div>
                  <label>{{t().to}}</label>
                  <select formControlName="to">
                    <option value="">{{t().selectDestination}}</option>
                    @for (s of stations; track s) {
                      <option [value]="s">{{s}}</option>
                    }
                  </select>
                </div>

                <div>
                  <label>{{t().journeyDate}}</label>
                  <input type="date" formControlName="date" [min]="today">
                </div>

                <button class="search-btn" type="submit">
                  {{t().searchTrains}}
                </button>
              </div>

              @if (message()) {
                <p class="error">{{message()}}</p>
              }
            </form>
          </div>
        </div>
      </section>

      <section class="features">
        <h2>{{t().whyChoose}}</h2>
        <p class="section-sub">{{t().featuresSubtitle}}</p>

        <div class="feature-grid">
          <div class="feature">
            <span>🚆</span>
            <h3>{{t().easySearch}}</h3>
            <p>{{t().easySearchDesc}}</p>
          </div>

          <div class="feature">
            <span>🎫</span>
            <h3>{{t().simpleBooking}}</h3>
            <p>{{t().simpleBookingDesc}}</p>
          </div>

          <div class="feature">
            <span>📋</span>
            <h3>{{t().pnrTracking}}</h3>
            <p>{{t().pnrTrackingDesc}}</p>
          </div>

          <div class="feature">
            <span>🌐</span>
            <h3>{{t().multipleLanguages}}</h3>
            <p>{{t().languagesDesc}}</p>
          </div>
        </div>
      </section>
    }

    @if (page() === 'availability') {
      <section class="content">
        <h1>{{t().availableTrains}}</h1>

        <p>
          {{searchForm.value.from}} → {{searchForm.value.to}}
          | {{formatDate(searchForm.value.date || '')}}
        </p>

        @for (train of results(); track train.number) {
          <div class="train-card">
            <div>
              <h3>{{train.name}}</h3>
              <small>{{t().trainNo}} {{train.number}}</small>
            </div>

            <div>
              <b>{{formatTime(train.departure)}}</b>
              <small>{{train.from}}</small>
            </div>

            <div>
              <b>{{train.duration}}</b>
              <small>{{t().duration}}</small>
            </div>

            <div>
              <b>{{formatTime(train.arrival)}}</b>
              <small>{{train.to}}</small>
            </div>

            <div>
              <select #cls>
                <option value="SL">
                  {{t().sleeper}} - {{formatCurrency(train.fare.SL)}}
                </option>
                <option value="3A">
                  {{t().ac3}} - {{formatCurrency(train.fare['3A'])}}
                </option>
                <option value="2A">
                  {{t().ac2}} - {{formatCurrency(train.fare['2A'])}}
                </option>
              </select>

              <button (click)="selectTrain(train,cls.value)">
                {{t().bookNow}}
              </button>
            </div>
          </div>
        } @empty {
          <p class="error">
            {{message() || t().noTrains}}
          </p>
        }

        <button class="back-btn" (click)="go('/')">
          {{t().backHome}}
        </button>
      </section>
    }

    @if (page() === 'login' || page() === 'register') {
      <section class="form-section">
        <div class="form-card">
          <h2>
            {{page() === 'login' ? t().welcome : t().createAccount}}
          </h2>

          <p>
            {{page() === 'login' ? t().loginDesc : t().registerDesc}}
          </p>

          <form [formGroup]="authForm" (ngSubmit)="submitAuth()">
            @if (page() === 'register') {
              <label>{{t().fullName}}</label>
              <input formControlName="name" [placeholder]="t().enterFullName">

              <label>{{t().mobile}}</label>
              <input formControlName="mobile"
                [placeholder]="t().mobilePlaceholder">
            }

            <label>{{t().email}}</label>
            <input type="email" formControlName="email"
              [placeholder]="t().enterEmail">

            <label>{{t().password}}</label>
            <input type="password" formControlName="password"
              [placeholder]="t().passwordPlaceholder">

            <button class="search-btn" type="submit">
              {{page() === 'login' ? t().login : t().register}}
            </button>
          </form>

          <p>{{message()}}</p>

          <p>
            {{page() === 'login' ? t().newUser : t().alreadyRegistered}}
            <a (click)="go(page() === 'login' ? '/register' : '/login')">
              {{page() === 'login' ? t().register : t().login}}
            </a>
          </p>
        </div>
      </section>
    }

    @if (page() === 'booking') {
      <section class="form-section">
        <div class="form-card">
          <h2>{{t().passengerDetails}}</h2>
          <p>{{selectedTrain()?.name}} | {{selectedClass()}}</p>

          <form [formGroup]="passengerForm" (ngSubmit)="bookTicket()">
            <label>{{t().passengerName}}</label>
            <input formControlName="name" [placeholder]="t().enterFullName">

            <label>{{t().age}}</label>
            <input type="number" formControlName="age" min="1" max="120">

            <label>{{t().gender}}</label>
            <select formControlName="gender">
              <option value="">{{t().selectGender}}</option>
              <option value="Male">{{t().male}}</option>
              <option value="Female">{{t().female}}</option>
              <option value="Other">{{t().other}}</option>
            </select>

            <h3>{{t().totalFare}} {{formatCurrency(fare())}}</h3>

            <button class="search-btn" type="submit">
              {{t().confirmBooking}}
            </button>
          </form>

          <p>{{message()}}</p>
        </div>
      </section>
    }

    @if (page() === 'my-bookings') {
      <section class="content">
        <h1>{{t().bookings}}</h1>

        @for (b of myBookings(); track b.pnr) {
          <div class="train-card">
            <div>
              <h3>{{b.train}}</h3>
              <p>{{t().passenger}} {{b.passenger}}</p>
              <p>{{t().pnr}} {{b.pnr}}</p>
              <p>{{t().journey}} {{formatDate(b.date)}}</p>
              <p>{{t().travelClass}} {{b.travelClass}}</p>
            </div>

            <div>
              <b>
                {{b.status === 'CANCELLED' ? t().cancelled : t().confirmed}}
              </b>
              <p>{{formatCurrency(b.fare)}}</p>

              @if (b.status !== 'CANCELLED') {
                <button class="cancel-btn" (click)="cancelBooking(b.pnr)">
                  {{t().cancelTicket}}
                </button>
              }
            </div>
          </div>
        } @empty {
          <p>{{t().noBookings}}</p>
        }
      </section>
    }

    @if (page() === 'pnr-status') {
      <section class="form-section">
        <div class="form-card">
          <h2>{{t().checkPnr}}</h2>

          <form [formGroup]="pnrForm" (ngSubmit)="checkPNR()">
            <label>{{t().enterPnr}}</label>
            <input formControlName="pnr" maxlength="10"
              [placeholder]="t().pnrPlaceholder">

            <button class="search-btn" type="submit">
              {{t().checkStatus}}
            </button>
          </form>

          @if (pnrResult()) {
            <h3>
              {{pnrResult().status === 'CANCELLED'
                ? t().cancelled : t().confirmed}}
            </h3>
            <p>{{t().train}} {{pnrResult().train}}</p>
            <p>{{t().passenger}} {{pnrResult().passenger}}</p>
            <p>{{t().pnr}} {{pnrResult().pnr}}</p>
          }

          <p>{{message()}}</p>
        </div>
      </section>
    }

    <footer>
      <h3>🚆 RailConnect</h3>
      <p>{{t().yourJourney}}</p>
      <p>{{t().footer}}</p>
    </footer>
  `,
})
export class RailwayPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  page = signal('home');
  message = signal('');
  results = signal<any[]>([]);
  selectedTrain = signal<any>(null);
  selectedClass = signal('SL');
  pnrResult = signal<any>(null);
  loggedIn = signal(!!localStorage.getItem('currentUser'));

  today = new Date().toISOString().split('T')[0];
  language = localStorage.getItem('language') || 'en';

  get locale() {
    return this.language === 'te'
      ? 'te-IN'
      : this.language === 'hi'
      ? 'hi-IN'
      : 'en-IN';
  }

  formatDate(date: string) {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(this.locale).format(
      new Date(year, month - 1, day)
    );
  }

  formatTime(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return new Intl.DateTimeFormat(this.locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(2026, 0, 1, hours, minutes));
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }

  searchForm = this.fb.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
    date: ['', Validators.required],
  });

  authForm = this.fb.group({
    name: [''],
    mobile: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  passengerForm = this.fb.group({
    name: ['', Validators.required],
    age: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(120)],
    ],
    gender: ['', Validators.required],
  });

  pnrForm = this.fb.group({
    pnr: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
  });

  stations = [
    'Hyderabad',
    'Vijayawada',
    'Chennai',
    'Bangalore',
    'Delhi',
    'Mumbai',
    'Visakhapatnam',
    'Tirupati',
  ];

  trains = [
    {
      number: '12727',
      name: 'Godavari Express',
      from: 'Hyderabad',
      to: 'Visakhapatnam',
      departure: '17:30',
      arrival: '05:50',
      duration: '12h 20m',
      fare: { SL: 450, '3A': 1200, '2A': 1750 },
    },
    {
      number: '12603',
      name: 'Charminar Express',
      from: 'Hyderabad',
      to: 'Chennai',
      departure: '18:10',
      arrival: '08:00',
      duration: '13h 50m',
      fare: { SL: 400, '3A': 1100, '2A': 1600 },
    },
    {
      number: '12760',
      name: 'Bangalore Express',
      from: 'Hyderabad',
      to: 'Bangalore',
      departure: '18:25',
      arrival: '07:15',
      duration: '12h 50m',
      fare: { SL: 420, '3A': 1150, '2A': 1650 },
    },
    {
      number: '12706',
      name: 'Intercity Express',
      from: 'Vijayawada',
      to: 'Hyderabad',
      departure: '06:00',
      arrival: '12:00',
      duration: '6h 00m',
      fare: { SL: 300, '3A': 800, '2A': 1200 },
    },
    {
      number: '12728',
      name: 'Godavari Express',
      from: 'Visakhapatnam',
      to: 'Hyderabad',
      departure: '17:00',
      arrival: '05:30',
      duration: '12h 30m',
      fare: { SL: 450, '3A': 1200, '2A': 1750 },
    },
  ];

  translations: any = {
    en: {
      home: 'Home',
      search: 'Train Search',
      bookings: 'My Bookings',
      pnrStatus: 'PNR Status',
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      heading: 'Discover India by Train',
      subtitle: 'Book your journey with comfort and confidence.',
      tagline: 'YOUR JOURNEY, OUR PRIORITY',
      from: 'From Station',
      to: 'To Station',
      selectSource: 'Select source',
      selectDestination: 'Select destination',
      journeyDate: 'Journey Date',
      searchTrains: 'Search Trains →',
      whyChoose: 'Why Choose RailConnect?',
      featuresSubtitle: 'Everything you need for a comfortable journey.',
      easySearch: 'Easy Train Search',
      easySearchDesc: 'Find trains between destinations.',
      simpleBooking: 'Simple Booking',
      simpleBookingDesc: 'Book tickets with ease.',
      pnrTracking: 'PNR Tracking',
      pnrTrackingDesc: 'Check your ticket status.',
      multipleLanguages: 'Multiple Languages',
      languagesDesc: 'English, Telugu and Hindi.',
      availableTrains: 'Available Trains',
      trainNo: 'Train No:',
      duration: 'Duration',
      sleeper: 'Sleeper (SL)',
      ac3: 'AC 3 Tier',
      ac2: 'AC 2 Tier',
      bookNow: 'Book Now',
      noTrains: 'No trains found for this route.',
      backHome: '← Back to Home',
      welcome: 'Welcome Back',
      createAccount: 'Create Account',
      loginDesc: 'Login to manage your bookings.',
      registerDesc: 'Register for a new account.',
      fullName: 'Full Name',
      enterFullName: 'Enter full name',
      mobile: 'Mobile Number',
      mobilePlaceholder: '10-digit mobile number',
      email: 'Email',
      enterEmail: 'Enter email',
      password: 'Password',
      passwordPlaceholder: 'Minimum 8 characters',
      newUser: 'New user?',
      alreadyRegistered: 'Already registered?',
      passengerDetails: 'Passenger Details',
      passengerName: 'Passenger Name',
      age: 'Age',
      gender: 'Gender',
      selectGender: 'Select gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      totalFare: 'Total Fare:',
      confirmBooking: 'Confirm Booking',
      journey: 'Journey:',
      passenger: 'Passenger:',
      pnr: 'PNR:',
      travelClass: 'Class:',
      confirmed: 'CONFIRMED',
      cancelled: 'CANCELLED',
      cancelTicket: 'Cancel Ticket',
      noBookings: 'No bookings available.',
      checkPnr: 'Check PNR Status',
      enterPnr: 'Enter 10-digit PNR Number',
      pnrPlaceholder: 'Enter PNR',
      checkStatus: 'Check Status',
      train: 'Train:',
      yourJourney: 'Your journey begins here.',
      footer: '© 2026 RailConnect | Educational Demo',
      errorSearch: 'Please enter source, destination and journey date.',
      sameStations: 'Source and destination cannot be the same.',
      noRoute: 'No route available from',
      validLogin: 'Please enter valid email and password (minimum 8 characters).',
      validMobile: 'Enter your name and valid 10-digit mobile number.',
      emailExists: 'This email is already registered.',
      invalidLogin: 'Invalid email or password.',
      passengerError: 'Please enter all passenger details correctly.',
      loginFirst: 'Please login and select a train first.',
      validPnr: 'Please enter a valid 10-digit PNR.',
      pnrNotFound: 'PNR not found. Please check the number.',
    },

    te: {
      home: 'హోమ్',
      search: 'రైళ్ల శోధన',
      bookings: 'నా బుకింగ్స్',
      pnrStatus: 'PNR స్థితి',
      login: 'లాగిన్',
      logout: 'లాగ్ అవుట్',
      register: 'రిజిస్టర్',
      heading: 'రైలులో భారతదేశాన్ని అన్వేషించండి',
      subtitle: 'మీ ప్రయాణాన్ని సౌకర్యంగా మరియు నమ్మకంగా బుక్ చేసుకోండి.',
      tagline: 'మీ ప్రయాణం మా ప్రాధాన్యత',
      from: 'ప్రారంభ స్టేషన్',
      to: 'గమ్యస్థాన స్టేషన్',
      selectSource: 'ప్రారంభ స్టేషన్ ఎంచుకోండి',
      selectDestination: 'గమ్యస్థానాన్ని ఎంచుకోండి',
      journeyDate: 'ప్రయాణ తేదీ',
      searchTrains: 'రైళ్లను వెతకండి →',
      whyChoose: 'RailConnect ను ఎందుకు ఎంచుకోవాలి?',
      featuresSubtitle: 'సౌకర్యవంతమైన ప్రయాణానికి కావలసినవన్నీ.',
      easySearch: 'సులభమైన రైలు శోధన',
      easySearchDesc: 'గమ్యస్థానాల మధ్య రైళ్లను కనుగొనండి.',
      simpleBooking: 'సులభమైన బుకింగ్',
      simpleBookingDesc: 'టిక్కెట్లను సులభంగా బుక్ చేసుకోండి.',
      pnrTracking: 'PNR ట్రాకింగ్',
      pnrTrackingDesc: 'మీ టికెట్ స్థితిని తనిఖీ చేయండి.',
      multipleLanguages: 'బహుళ భాషలు',
      languagesDesc: 'ఇంగ్లీష్, తెలుగు మరియు హిందీ.',
      availableTrains: 'అందుబాటులో ఉన్న రైళ్లు',
      trainNo: 'రైలు నంబర్:',
      duration: 'ప్రయాణ సమయం',
      sleeper: 'స్లీపర్ (SL)',
      ac3: 'ఏసీ 3 టైర్',
      ac2: 'ఏసీ 2 టైర్',
      bookNow: 'ఇప్పుడే బుక్ చేయండి',
      noTrains: 'ఈ మార్గంలో రైళ్లు అందుబాటులో లేవు.',
      backHome: '← హోమ్‌కు తిరిగి వెళ్లండి',
      welcome: 'స్వాగతం',
      createAccount: 'ఖాతాను సృష్టించండి',
      loginDesc: 'మీ బుకింగ్‌లను నిర్వహించడానికి లాగిన్ అవ్వండి.',
      registerDesc: 'కొత్త ఖాతా కోసం నమోదు చేసుకోండి.',
      fullName: 'పూర్తి పేరు',
      enterFullName: 'పూర్తి పేరు నమోదు చేయండి',
      mobile: 'మొబైల్ నంబర్',
      mobilePlaceholder: '10 అంకెల మొబైల్ నంబర్',
      email: 'ఈమెయిల్',
      enterEmail: 'ఈమెయిల్ నమోదు చేయండి',
      password: 'పాస్‌వర్డ్',
      passwordPlaceholder: 'కనీసం 8 అక్షరాలు',
      newUser: 'కొత్త వినియోగదారులా?',
      alreadyRegistered: 'ఇప్పటికే నమోదు చేసుకున్నారా?',
      passengerDetails: 'ప్రయాణికుడి వివరాలు',
      passengerName: 'ప్రయాణికుడి పేరు',
      age: 'వయస్సు',
      gender: 'లింగం',
      selectGender: 'లింగాన్ని ఎంచుకోండి',
      male: 'పురుషుడు',
      female: 'స్త్రీ',
      other: 'ఇతర',
      totalFare: 'మొత్తం ఛార్జీ:',
      confirmBooking: 'బుకింగ్ నిర్ధారించండి',
      journey: 'ప్రయాణం:',
      passenger: 'ప్రయాణికుడు:',
      pnr: 'PNR:',
      travelClass: 'తరగతి:',
      confirmed: 'నిర్ధారించబడింది',
      cancelled: 'రద్దు చేయబడింది',
      cancelTicket: 'టికెట్ రద్దు చేయండి',
      noBookings: 'బుకింగ్‌లు ఏవీ లేవు.',
      checkPnr: 'PNR స్థితిని తనిఖీ చేయండి',
      enterPnr: '10 అంకెల PNR నంబర్ నమోదు చేయండి',
      pnrPlaceholder: 'PNR నమోదు చేయండి',
      checkStatus: 'స్థితిని తనిఖీ చేయండి',
      train: 'రైలు:',
      yourJourney: 'మీ ప్రయాణం ఇక్కడ ప్రారంభమవుతుంది.',
      footer: '© 2026 RailConnect | విద్యా ప్రయోజనాల డెమో',
      errorSearch: 'ప్రారంభ స్టేషన్, గమ్యస్థానం మరియు ప్రయాణ తేదీ నమోదు చేయండి.',
      sameStations: 'ప్రారంభ స్టేషన్ మరియు గమ్యస్థానం ఒకటే కాకూడదు.',
      noRoute: 'ఈ మార్గంలో రైలు అందుబాటులో లేదు:',
      validLogin: 'సరైన ఈమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి (కనీసం 8 అక్షరాలు).',
      validMobile: 'మీ పేరు మరియు సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.',
      emailExists: 'ఈ ఈమెయిల్ ఇప్పటికే నమోదు చేయబడింది.',
      invalidLogin: 'ఈమెయిల్ లేదా పాస్‌వర్డ్ తప్పు.',
      passengerError: 'ప్రయాణికుడి వివరాలన్నింటినీ సరిగ్గా నమోదు చేయండి.',
      loginFirst: 'ముందుగా లాగిన్ అయి రైలును ఎంచుకోండి.',
      validPnr: 'సరైన 10 అంకెల PNR నమోదు చేయండి.',
      pnrNotFound: 'PNR కనుగొనబడలేదు. నంబర్‌ను తనిఖీ చేయండి.',
    },

    hi: {
      home: 'होम',
      search: 'ट्रेन खोजें',
      bookings: 'मेरी बुकिंग',
      pnrStatus: 'PNR स्थिति',
      login: 'लॉगिन',
      logout: 'लॉगआउट',
      register: 'रजिस्टर',
      heading: 'ट्रेन से भारत की यात्रा करें',
      subtitle: 'अपनी यात्रा आराम और विश्वास के साथ बुक करें।',
      tagline: 'आपकी यात्रा, हमारी प्राथमिकता',
      from: 'प्रस्थान स्टेशन',
      to: 'गंतव्य स्टेशन',
      selectSource: 'प्रस्थान स्टेशन चुनें',
      selectDestination: 'गंतव्य चुनें',
      journeyDate: 'यात्रा की तारीख',
      searchTrains: 'ट्रेन खोजें →',
      whyChoose: 'RailConnect क्यों चुनें?',
      featuresSubtitle: 'आरामदायक यात्रा के लिए आपको जो कुछ चाहिए।',
      easySearch: 'आसान ट्रेन खोज',
      easySearchDesc: 'दो स्टेशनों के बीच ट्रेन खोजें।',
      simpleBooking: 'आसान बुकिंग',
      simpleBookingDesc: 'आसानी से टिकट बुक करें।',
      pnrTracking: 'PNR ट्रैकिंग',
      pnrTrackingDesc: 'अपने टिकट की स्थिति जांचें।',
      multipleLanguages: 'कई भाषाएँ',
      languagesDesc: 'अंग्रेज़ी, तेलुगु और हिंदी।',
      availableTrains: 'उपलब्ध ट्रेनें',
      trainNo: 'ट्रेन नंबर:',
      duration: 'यात्रा अवधि',
      sleeper: 'स्लीपर (SL)',
      ac3: 'एसी 3 टियर',
      ac2: 'एसी 2 टियर',
      bookNow: 'अभी बुक करें',
      noTrains: 'इस मार्ग पर कोई ट्रेन नहीं मिली।',
      backHome: '← होम पर वापस जाएँ',
      welcome: 'वापसी पर स्वागत है',
      createAccount: 'खाता बनाएँ',
      loginDesc: 'अपनी बुकिंग प्रबंधित करने के लिए लॉगिन करें।',
      registerDesc: 'नया खाता बनाने के लिए रजिस्टर करें।',
      fullName: 'पूरा नाम',
      enterFullName: 'पूरा नाम दर्ज करें',
      mobile: 'मोबाइल नंबर',
      mobilePlaceholder: '10 अंकों का मोबाइल नंबर',
      email: 'ईमेल',
      enterEmail: 'ईमेल दर्ज करें',
      password: 'पासवर्ड',
      passwordPlaceholder: 'कम से कम 8 अक्षर',
      newUser: 'नए उपयोगकर्ता हैं?',
      alreadyRegistered: 'पहले से पंजीकृत हैं?',
      passengerDetails: 'यात्री का विवरण',
      passengerName: 'यात्री का नाम',
      age: 'आयु',
      gender: 'लिंग',
      selectGender: 'लिंग चुनें',
      male: 'पुरुष',
      female: 'महिला',
      other: 'अन्य',
      totalFare: 'कुल किराया:',
      confirmBooking: 'बुकिंग की पुष्टि करें',
      journey: 'यात्रा:',
      passenger: 'यात्री:',
      pnr: 'PNR:',
      travelClass: 'श्रेणी:',
      confirmed: 'पुष्टि की गई',
      cancelled: 'रद्द किया गया',
      cancelTicket: 'टिकट रद्द करें',
      noBookings: 'कोई बुकिंग उपलब्ध नहीं है।',
      checkPnr: 'PNR स्थिति जांचें',
      enterPnr: '10 अंकों का PNR नंबर दर्ज करें',
      pnrPlaceholder: 'PNR दर्ज करें',
      checkStatus: 'स्थिति जांचें',
      train: 'ट्रेन:',
      yourJourney: 'आपकी यात्रा यहाँ से शुरू होती है।',
      footer: '© 2026 RailConnect | शैक्षिक डेमो',
      errorSearch: 'प्रस्थान स्टेशन, गंतव्य और यात्रा की तारीख दर्ज करें।',
      sameStations: 'प्रस्थान और गंतव्य स्टेशन एक जैसे नहीं हो सकते।',
      noRoute: 'इस मार्ग पर कोई ट्रेन उपलब्ध नहीं है:',
      validLogin: 'सही ईमेल और पासवर्ड दर्ज करें (कम से कम 8 अक्षर)।',
      validMobile: 'अपना नाम और सही 10 अंकों का मोबाइल नंबर दर्ज करें।',
      emailExists: 'यह ईमेल पहले से पंजीकृत है।',
      invalidLogin: 'ईमेल या पासवर्ड गलत है।',
      passengerError: 'कृपया यात्री का पूरा विवरण सही ढंग से दर्ज करें।',
      loginFirst: 'कृपया पहले लॉगिन करें और ट्रेन चुनें।',
      validPnr: 'कृपया सही 10 अंकों का PNR दर्ज करें।',
      pnrNotFound: 'PNR नहीं मिला। कृपया नंबर जांचें।',
    },
  };

  t = signal(this.translations.en);

  constructor() {
    const savedSearch = localStorage.getItem('lastSearch');

    if (savedSearch) {
      const data = JSON.parse(savedSearch);

      this.searchForm.patchValue({
        from: data.from || '',
        to: data.to || '',
        date: data.date || '',
      });

      this.results.set(data.results || []);
    }

    const savedTrain = localStorage.getItem('selectedTrain');

    if (savedTrain) {
      const data = JSON.parse(savedTrain);
      this.selectedTrain.set(data.train);
      this.selectedClass.set(data.travelClass || 'SL');
    }

    const savedLanguage = localStorage.getItem('language') || 'en';
    this.language = savedLanguage;
    this.t.set(this.translations[savedLanguage] || this.translations.en);

    this.updatePage();

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.updatePage());
  }

  updatePage() {
    const path = this.router.url.split('?')[0];
    this.page.set(path === '/' ? 'home' : path.substring(1));
  }

  go(path: string) {
    this.message.set('');
    this.pnrResult.set(null);
    this.router.navigate([path]);
  }

  changeLanguage(event: Event) {
    const lang = (event.target as HTMLSelectElement).value;
    this.language = lang;
    this.t.set(this.translations[lang] || this.translations.en);
    localStorage.setItem('language', lang);
  }

  searchTrains() {
    this.message.set('');

    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.message.set(this.t().errorSearch);
      return;
    }

    const formData = this.searchForm.getRawValue();

    const from = String(formData.from || '').trim().toLowerCase();
    const to = String(formData.to || '').trim().toLowerCase();

    if (from === to) {
      this.message.set(this.t().sameStations);
      return;
    }

    const matchedTrains = this.trains.filter(
      (train) =>
        train.from.trim().toLowerCase() === from &&
        train.to.trim().toLowerCase() === to
    );

    this.results.set(matchedTrains);

    localStorage.setItem(
      'lastSearch',
      JSON.stringify({
        from: formData.from,
        to: formData.to,
        date: formData.date,
        results: matchedTrains,
      })
    );

    if (matchedTrains.length === 0) {
      this.message.set(
        `${this.t().noRoute} ${formData.from} → ${formData.to}.`
      );
    }

    this.router.navigateByUrl('/availability');
  }

  selectTrain(train: any, travelClass: string) {
    this.selectedTrain.set(train);
    this.selectedClass.set(travelClass);

    localStorage.setItem(
      'selectedTrain',
      JSON.stringify({
        train,
        travelClass,
      })
    );

    this.passengerForm.reset();
    this.go('/booking');
  }

  fare() {
    const train = this.selectedTrain();
    return train ? train.fare[this.selectedClass()] : 0;
  }

  submitAuth() {
    this.message.set('');

    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      this.message.set(this.t().validLogin);
      return;
    }

    const { name, mobile, email, password } =
      this.authForm.getRawValue();

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (this.page() === 'register') {
      if (!name || !mobile || !/^[0-9]{10}$/.test(mobile)) {
        this.message.set(this.t().validMobile);
        return;
      }

      if (users.some((u: any) => u.email === email)) {
        this.message.set(this.t().emailExists);
        return;
      }

      users.push({ name, mobile, email, password });
      localStorage.setItem('users', JSON.stringify(users));

      this.go('/login');
      return;
    }

    const user = users.find(
      (u: any) => u.email === email && u.password === password
    );

    if (!user) {
      this.message.set(this.t().invalidLogin);
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    this.loggedIn.set(true);
    this.go('/');
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.loggedIn.set(false);
    this.go('/');
  }

  allBookings() {
    return JSON.parse(localStorage.getItem('bookings') || '[]');
  }

  myBookings() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');

    return user
      ? this.allBookings().filter((b: any) => b.email === user.email)
      : [];
  }

  bookTicket() {
    if (this.passengerForm.invalid) {
      this.passengerForm.markAllAsTouched();
      this.message.set(this.t().passengerError);
      return;
    }

    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!user || !this.selectedTrain()) {
      this.message.set(this.t().loginFirst);
      return;
    }

    const p = this.passengerForm.getRawValue();

    const pnr = Math.floor(
      1000000000 + Math.random() * 9000000000
    ).toString();

    const booking = {
      pnr,
      email: user.email,
      passenger: p.name,
      age: p.age,
      gender: p.gender,
      train: this.selectedTrain().name,
      trainNumber: this.selectedTrain().number,
      from: this.selectedTrain().from,
      to: this.selectedTrain().to,
      date: this.searchForm.value.date,
      travelClass: this.selectedClass(),
      fare: this.fare(),
      status: 'CONFIRMED',
    };

    const bookings = this.allBookings();
    bookings.push(booking);

    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.removeItem('selectedTrain');

    this.go('/my-bookings');
  }

  cancelBooking(pnr: string) {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const updated = this.allBookings().map((b: any) =>
      b.pnr === pnr && b.email === user?.email
        ? { ...b, status: 'CANCELLED' }
        : b
    );

    localStorage.setItem('bookings', JSON.stringify(updated));
  }

  checkPNR() {
    this.pnrResult.set(null);
    this.message.set('');

    if (this.pnrForm.invalid) {
      this.pnrForm.markAllAsTouched();
      this.message.set(this.t().validPnr);
      return;
    }

    const pnr = this.pnrForm.value.pnr;

    const booking = this.allBookings().find(
      (b: any) => b.pnr === pnr
    );

    if (!booking) {
      this.message.set(this.t().pnrNotFound);
      return;
    }

    this.pnrResult.set(booking);
  }
}

const routes: Routes = [
  { path: '', component: RailwayPage },
  { path: 'search', component: RailwayPage },
  { path: 'availability', component: RailwayPage },
  { path: 'login', component: RailwayPage },
  { path: 'register', component: RailwayPage },
  { path: 'booking', component: RailwayPage, canActivate: [authGuard] },
  { path: 'my-bookings', component: RailwayPage, canActivate: [authGuard] },
  { path: 'pnr-status', component: RailwayPage },
  { path: '**', redirectTo: '' },
];

bootstrapApplication(App, {
  providers: [provideRouter(routes)],
}).catch((err) => console.error(err));
