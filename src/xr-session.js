import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

export function setupXRSession(renderer, scene, showDefaultHands = true) {
  const handModelFactory = new XRHandModelFactory();
  const hands = [];
  const handModels = [];

  // Set up both hands (0 = left, 1 = right)
  for (let i = 0; i < 2; i++) {
    const hand = renderer.xr.getHand(i);
    scene.add(hand);

    // Add visual hand model (can be hidden later)
    const handModel = handModelFactory.createHandModel(hand, 'mesh');
    handModel.visible = showDefaultHands;
    hand.add(handModel);

    hands.push(hand);
    handModels.push(handModel);
  }

  return { hands, handModels };
}

export function createVRButton(renderer) {
  const button = document.createElement('button');
  button.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border: 1px solid #fff;
    border-radius: 4px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    font: normal 14px sans-serif;
    cursor: pointer;
    z-index: 999;
  `;
  button.textContent = 'ENTER VR';

  async function onButtonClick() {
    if (!navigator.xr) {
      console.error('WebXR not available');
      return;
    }

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['hand-tracking'],
        optionalFeatures: ['local-floor', 'bounded-floor']
      });
      renderer.xr.setSession(session);
      button.textContent = 'EXIT VR';

      session.addEventListener('end', () => {
        button.textContent = 'ENTER VR';
      });
    } catch (err) {
      console.error('Failed to start XR session:', err);
      // Fallback: try with hand-tracking as optional
      try {
        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
        });
        renderer.xr.setSession(session);
        button.textContent = 'EXIT VR (no hands)';

        session.addEventListener('end', () => {
          button.textContent = 'ENTER VR';
        });
      } catch (fallbackErr) {
        console.error('Fallback XR session also failed:', fallbackErr);
      }
    }
  }

  button.addEventListener('click', onButtonClick);
  document.body.appendChild(button);

  // Check XR support
  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
      if (!supported) {
        button.textContent = 'VR NOT SUPPORTED';
        button.disabled = true;
      }
    });
  } else {
    button.textContent = 'WEBXR NOT AVAILABLE';
    button.disabled = true;
  }

  return button;
}
