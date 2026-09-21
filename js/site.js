// Lilcrash15 — shared site behavior

document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close the menu after a link is picked (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});

// Modern clipboard copy with a graceful fallback, used on the Minecraft page.
function copyServerAddress(button, inputId) {
  var field = document.getElementById(inputId);
  if (!field) return;

  var finish = function (ok) {
    var original = button.textContent;
    button.textContent = ok ? 'Copied!' : 'Copy failed';
    setTimeout(function () {
      button.textContent = original;
    }, 1800);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(field.value).then(function () {
      finish(true);
    }).catch(function () {
      legacyCopy(field, finish);
    });
  } else {
    legacyCopy(field, finish);
  }
}

function legacyCopy(field, finish) {
  try {
    field.select();
    field.setSelectionRange(0, 99999);
    var ok = document.execCommand('copy');
    finish(ok);
  } catch (err) {
    finish(false);
  }
}

function confirmRedirect(event, destination) {
  // Non-blocking equivalent of the old alert() — lets the link proceed,
  // this just exists as a hook if you want to log/track outbound clicks later.
}
