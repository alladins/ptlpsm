import { defineNuxtConfig } from "nuxt/config";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const currentDir = dirname(fileURLToPath(import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '@/assets/css/main.css',
    '@/assets/css/global.css',
    '@/assets/css/admin-common.css',
    '@/assets/css/admin-buttons.css', // 버튼 스타일 (admin-common.css에서 분리)
    '@/assets/css/admin-forms.css',
    '@/assets/css/admin-search.css',
    '@/assets/css/admin-tables.css',
    '@/assets/css/admin-edit-register.css', // 등록/수정 페이지 공통 스타일
    '@/assets/css/admin-detail.css', // 상세/확인 페이지 공통 스타일
    '@/assets/css/admin-receipts.css',
    '@/assets/css/mobile-delivery.css', // 모바일 배송 확인 페이지 스타일
    'swiper/css',
    'swiper/css/pagination',
    'swiper/css/navigation',
    'swiper/css/autoplay',
    'swiper/css/effect-fade',
    'aos/dist/aos.css'
  ],

  modules: [
    '@nuxt/image',
    '@pinia/nuxt'
  ],

  app: {
    head: {
      htmlAttrs: {
        lang: 'ko'
      },
      title: 'PTPLPSM - 출하관리 시스템',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { key: 'description', name: 'description', content: 'PTPLPSM 출하관리 시스템 - 효율적인 출하 프로세스 관리' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'keywords', content: '출하관리, 물류관리, 재고관리, 배송관리, PTPLPSM, 출하시스템, 물류시스템, 재고시스템, 배송시스템' },
        { key: 'og:title', property: 'og:title', content: 'PTPLPSM - 출하관리 시스템' },
        { key: 'og:description', property: 'og:description', content: 'PTPLPSM 출하관리 시스템 - 효율적인 출하 프로세스 관리 및 물류 최적화 솔루션' },
        { key: 'og:type', property: 'og:type', content: 'website' },
        { key: 'robots', name: 'robots', content: 'index,follow' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: 'https://unpkg.com/aos@2.3.1/dist/aos.css' }
      ],
      script: [
        // Google Analytics는 플러그인에서 처리
        // Kakao Pixel Tracking - 임시 주석처리
        /*
        {
          src: '//t1.daumcdn.net/kas/static/kp.js',
          type: 'text/javascript'
        },
        */
        { src: 'https://unpkg.com/aos@2.3.1/dist/aos.js', defer: true, crossorigin: 'anonymous' },
        { src: '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js' },
        // 브라우저 줌 방지 스크립트
        {
          innerHTML: `
            // 브라우저 줌 방지
            document.addEventListener('DOMContentLoaded', function() {
              // Ctrl + 마우스 휠 줌 방지
              document.addEventListener('wheel', function(e) {
                if (e.ctrlKey) {
                  e.preventDefault();
                }
              }, { passive: false });
              
              // Ctrl + +/- 키 줌 방지
              document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) {
                  e.preventDefault();
                }
              });
              
              // 더블탭 줌 방지 (모바일)
              let lastTouchEnd = 0;
              document.addEventListener('touchend', function(e) {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                  e.preventDefault();
                }
                lastTouchEnd = now;
              }, false);
            });
          `,
          type: 'text/javascript'
        }
      ]
    },
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    cdnURL: ''
  },

  components: {
    global: true,
    dirs: [
      '~/components'
    ]
  },

  image: {
    dir: 'public/images',
    formats: ['webp', 'jpg', 'png'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    provider: 'ipx',
    presets: {
      default: {
        modifiers: {
          format: 'webp'
        }
      }
    },
    domains: ['localhost'],
    staticFilename: '[publicPath]/images/[name][ext]',
    quality: 80,
    optimizeImagesInDev: false
  },

  // 정적 사이트 생성(SSG) 설정
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/system/iso9001',
        '/system/iso14001',
        '/system/iso45001',
        '/system/cert_process',
        '/product/ks',
        '/product/kc',
        '/product/ce',
        '/product/standard',
        '/management/research-lab',
        '/management/venture',
        '/management/innobiz',
        '/management/mainbiz',
        '/policy-funds/operating',
        '/policy-funds/facilities',
        '/about/greeting',
        '/about/history',
        '/about/location',
        '/inquiry/consultation',
        '/terms',
        '/privacy'
      ],
      ignore: [
        '/api/**',
        '**/.nuxt/**',
        '**/.git/**',
        '**/node_modules/**',
        '/admin/**',
        '/404'
      ],
      failOnError: false
    },
    storage: {
      fs: {
        driver: 'fs',
        base: join(currentDir, '.nuxt/storage')
      }
    },
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      },
      '/m/**': {
        ssr: false,  // SPA 모드로 동작
        prerender: false  // 동적 라우트이므로 사전 렌더링 안 함
      },
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        },
        static: true
      },
      '/**': {
        static: true,
        headers: {
          'cache-control': 'public, max-age=3600'
        }
      }
    },
    publicAssets: [
      {
        dir: 'public',
        baseURL: '/'
      }
    ],
    devStorage: {
      fs: {
        driver: 'fs',
        base: join(currentDir, '.nuxt/dev-storage')
      }
    },
    buildDir: '.nuxt/build',
    serveStatic: true
  },

  runtimeConfig: {
    apiSecret: process.env.API_SECRET,
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      nodeEnv: process.env.NODE_ENV || 'development',
      excludeVisitPaths: [
        '/login',
        '/logout',
        '/admin',
        '/_nuxt',
        '/api'
      ],
      siteUrl: 'https://www.ptlpsm.com',
      siteName: 'PTPLPSM'
    }
  },

  routeRules: {
    '/**': { 
      cache: {
        maxAge: 3600
      }
    },
    '/404': {
      prerender: true
    },
    '/_nuxt/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    },
    '/_nuxt/builds/meta/**': {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      },
      redirect: { to: '/', statusCode: 302 }
    }
  },

  // SSR 비활성화 (정적 사이트 생성)
  ssr: false,

  experimental: {
    payloadExtraction: true,
    viewTransition: true
  },

  devServer: {
    port: 3000,
    host: 'localhost',
    https: false
  },

  typescript: {
    strict: false,
    shim: false
  },

  // 정적 사이트 생성을 위한 generate 설정
  generate: {
    routes: [
      '/',
      '/system/iso9001',
      '/system/iso14001',
      '/system/iso45001',
      '/system/cert_process',
      '/product/ks',
      '/product/kc',
      '/product/ce',
      '/product/standard',
      '/management/research-lab',
      '/management/venture',
      '/management/innobiz',
      '/management/mainbiz',
      '/policy-funds/operating',
      '/policy-funds/facilities',
      '/about/greeting',
      '/about/history',
      '/about/location',
      '/inquiry/consultation',
      '/terms',
      '/privacy'
    ],
    exclude: [
      '/_nuxt/builds/meta/**'
    ]
  },

  // 빌드 최적화 설정
  build: {
    transpile: [
      'swiper',
      'aos'
    ]
  },

  vite: {
    optimizeDeps: {
      include: ['swiper', 'swiper/vue', 'aos'],
      exclude: []
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    server: {
      watch: {
        usePolling: true
      },
      hmr: true  // HMR 활성화: 코드 변경 시 자동 반영
    },
    ssr: {
      noExternal: ['aos']
    },
    css: {
      devSourcemap: false
    },
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.webp']
  },

  compatibilityDate: '2025-03-06',

  // PostCSS 설정
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  },
})