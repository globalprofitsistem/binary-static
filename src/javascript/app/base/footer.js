const Cookies        = require('js-cookie');
const BinarySocket   = require('./socket');
const Client         = require('../base/client');
const isEuCountry    = require('../common/country_base').isEuCountry;
const getElementById = require('../../_common/common_functions').getElementById;
const LocalStore     = require('../../_common/storage').LocalStore;
const State          = require('../../_common/storage').State;

const Footer = (() => {
    const onLoad = () => {
        BinarySocket.wait('website_status', 'authorize', 'landing_company').then(() => {
            // show CFD warning to logged in maltainvest clients or
            // logged in virtual clients with maltainvest financial landing company or
            // logged out clients with EU IP address
            if (Client.isLoggedIn()) {
                showWarning((Client.get('landing_company_shortcode') === 'maltainvest' ||
                    (Client.get('is_virtual') && State.getResponse('landing_company.financial_company.shortcode') === 'maltainvest')));
            } else {
                showWarning(isEuCountry());
            }
        });
    };

    const showWarning = (should_show_warning) => {
        $('#footer-regulatory .eu-only').setVisibility(should_show_warning);
    };

    const clearNotification = () => {
        const $status_notification = $('#status_notification');
        $status_notification.slideUp(200);
    };

    // by default elevio is 8px above bottom of page, and scrollup is 18px above elevio
    const adjustNotifElevioAndScrollup = (elevio_height = 8, scrollup_height = 18, status_height = 8) => {
        const $elevio_button = $('#_elev_io ._6byvm');
        const $scrollup = $('#scrollup');
        const $status_notification = $('#status_notification');
        
        $elevio_button.attr('style', `bottom: ${elevio_height}px !important`);
        $status_notification.attr('style', `bottom: ${status_height}px !important`);
        $scrollup.attr('style', `bottom: ${$elevio_button.height() + scrollup_height}px`);
    };

    const clearDialogMessage = () => {
        const $dialog_notification = $('#dialog_notification');
        const el_footer = getElementById('footer');

        el_footer.style.paddingBottom = '0px';
        $dialog_notification.slideUp(200);
        adjustNotifElevioAndScrollup();
    };

    const displayDialogMessage = () => {
        BinarySocket.wait('website_status', 'authorize', 'landing_company').then(() => {
            if (isEuCountry()) {
                const $dialog_notification = $('#dialog_notification');
                const el_dialog_notification_accept = getElementById('dialog_notification_accept');
                const el_footer = getElementById('footer');
                const gap_dialog_to_elevio = 30;
                const gap_elevio_to_scrollup = 10;

                $dialog_notification.css('display', 'flex');
                el_footer.style.paddingBottom = `${$dialog_notification.height()}px`;
                adjustNotifElevioAndScrollup($dialog_notification.height() + gap_dialog_to_elevio,
                    $dialog_notification.height() + gap_dialog_to_elevio + gap_elevio_to_scrollup,
                    $dialog_notification.height() + gap_dialog_to_elevio);

                el_dialog_notification_accept
                    .addEventListener('click', () => {
                        adjustNotifElevioAndScrollup();
                        $dialog_notification.slideUp(200);
                        el_footer.style.paddingBottom = '0px';
                        Cookies.set('CookieConsent', 1);
                    });
                window.addEventListener('resize', () => {
                    adjustNotifElevioAndScrollup($dialog_notification.height() + gap_dialog_to_elevio,
                        $dialog_notification.height() + gap_dialog_to_elevio + gap_elevio_to_scrollup);
                });
            }
        });
    };
    
    const displayNotification = (message) => {
        BinarySocket.wait('time').then((response) => {
            const notification_storage = LocalStore.getObject('status_notification');
            const time_difference = (parseInt(response.time) - (parseInt(notification_storage.close_time) || 0));
            const required_difference = 30 * 60;
            
            if (time_difference > required_difference || notification_storage.message !== message) {
                const $status_message_text = $('#status_notification_text');
                const $close_icon = $('#status_notification_close');
                const $status_notification = $('#status_notification');

                $status_notification.css('display', 'flex');
                $status_message_text.html(message);
                $close_icon
                    .off('click')
                    .on('click', () => {
                        $status_notification.slideUp(200);
                        notification_storage.message = message;
                        notification_storage.close_time = response.time;
                        LocalStore.setObject('status_notification', notification_storage);
                    });
            }
        });
    };

    return {
        onLoad,
        clearNotification,
        displayNotification,
        displayDialogMessage,
        clearDialogMessage,
    };
})();

module.exports = Footer;
