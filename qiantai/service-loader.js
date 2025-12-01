/**
 * Providence Service Loader
 * Loads all business workflow services for the application
 *
 * Include this script in HTML pages to enable:
 * - Investment Order Workflow
 * - VIP Upgrade Workflow
 * - Team Reward Distribution
 */

(function () {
  'use strict';

  // Track loaded services
  const loadedServices = {};

  /**
   * Load a script dynamically
   * @param {string} src - Script source URL
   * @param {string} name - Service name for tracking
   * @returns {Promise<void>}
   */
  function loadScript(src, name) {
    return new Promise((resolve, reject) => {
      if (loadedServices[name]) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.onload = () => {
        loadedServices[name] = true;
        console.log(`[ServiceLoader] Loaded: ${name}`);
        resolve();
      };

      script.onerror = () => {
        console.error(`[ServiceLoader] Failed to load: ${name}`);
        reject(new Error(`Failed to load ${name}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize all services
   */
  async function initServices() {
    const basePath = getBasePath();

    try {
      // Load services in parallel
      await Promise.all([
        loadScript(`${basePath}src/services/investmentWorkflow.js`, 'InvestmentWorkflowService'),
        loadScript(`${basePath}src/services/vipUpgradeService.js`, 'VipUpgradeService'),
        loadScript(`${basePath}src/services/teamRewardService.js`, 'TeamRewardService')
      ]);

      console.log('[ServiceLoader] All services loaded successfully');

      // Dispatch event to notify that services are ready
      window.dispatchEvent(new CustomEvent('servicesReady', {
        detail: {
          services: ['InvestmentWorkflowService', 'VipUpgradeService', 'TeamRewardService']
        }
      }));
    } catch (err) {
      console.error('[ServiceLoader] Error loading services:', err);

      // Still dispatch event but with partial loading info
      window.dispatchEvent(new CustomEvent('servicesReady', {
        detail: {
          services: Object.keys(loadedServices),
          error: err.message
        }
      }));
    }
  }

  /**
   * Get the base path for scripts
   * @returns {string}
   */
  function getBasePath() {
    // Check if we're in a subdirectory
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src.includes('service-loader.js')) {
        return src.replace('service-loader.js', '');
      }
    }
    return './';
  }

  /**
   * Wait for services to be ready
   * @returns {Promise<void>}
   */
  window.waitForServices = function () {
    return new Promise((resolve) => {
      if (window.InvestmentWorkflowService && window.VipUpgradeService && window.TeamRewardService) {
        resolve();
        return;
      }

      window.addEventListener('servicesReady', () => {
        resolve();
      }, { once: true });

      // Timeout after 10 seconds
      setTimeout(resolve, 10000);
    });
  };

  /**
   * Check if services are available
   * @returns {boolean}
   */
  window.areServicesReady = function () {
    return !!(
      window.InvestmentWorkflowService &&
      window.VipUpgradeService &&
      window.TeamRewardService
    );
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServices);
  } else {
    initServices();
  }
})();
