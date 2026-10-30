const form = document.querySelector('#quote-form');
const steps = [...document.querySelectorAll('.form-step')];
let current = 0;
const next = document.querySelector('#next');
const error = document.querySelector('#form-error');
const back = document.querySelector('#back');
const states = 'AL:Alabama,AK:Alaska,AZ:Arizona,AR:Arkansas,CA:California,CO:Colorado,CT:Connecticut,DE:Delaware,DC:District of Columbia,FL:Florida,GA:Georgia,HI:Hawaii,ID:Idaho,IL:Illinois,IN:Indiana,IA:Iowa,KS:Kansas,KY:Kentucky,LA:Louisiana,ME:Maine,MD:Maryland,MA:Massachusetts,MI:Michigan,MN:Minnesota,MS:Mississippi,MO:Missouri,MT:Montana,NE:Nebraska,NV:Nevada,NH:New Hampshire,NJ:New Jersey,NM:New Mexico,NY:New York,NC:North Carolina,ND:North Dakota,OH:Ohio,OK:Oklahoma,OR:Oregon,PA:Pennsylvania,RI:Rhode Island,SC:South Carolina,SD:South Dakota,TN:Tennessee,TX:Texas,UT:Utah,VT:Vermont,VA:Virginia,WA:Washington,WV:West Virginia,WI:Wisconsin,WY:Wyoming';
for (const entry of states.split(',')) { const [value, label] = entry.split(':'); document.querySelector('#state').add(new Option(label, value)); }
function render(focus = true) {
  steps.forEach((step, index) => { step.hidden = index !== current; step.querySelectorAll('input, select').forEach(input => input.disabled = index !== current); });
  document.querySelector('#step-count').textContent = `STEP ${current + 1} OF 3`;
  document.querySelector('#step-label').textContent = ['YOUR PROJECT', 'YOUR PROPERTY', 'YOUR DETAILS'][current];
  document.querySelector('#progress-fill').style.width = `${(current + 1) / 3 * 100}%`;
  next.innerHTML = current === 2 ? 'Save my request <span>↗</span>' : 'Continue <span>→</span>';
  back.hidden = current === 0;
  error.textContent = '';
  if (focus) steps[current].querySelector('input, select').focus();
}
render(false);
back.addEventListener('click', () => { current--; render(); });
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  if (current < 2) { current++; render(); return; }
  const data = {};
  for (const input of form.querySelectorAll('[name]')) data[input.name] = input.type === 'checkbox' ? input.checked : input.value;
  next.disabled = true;
  next.textContent = 'Saving…';
  error.textContent = '';
  try {
    const response = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Please try again.');
    form.hidden = true;
    document.querySelector('#success').hidden = false;
    document.querySelector('#reference').textContent = `Reference: ${result.id}`;
    document.querySelector('#success').setAttribute('tabindex', '-1');
    document.querySelector('#success').focus();
  } catch (e) { error.textContent = e.message || 'Connection failed. Please try again.'; }
  finally { next.disabled = false; next.innerHTML = 'Save my request <span>↗</span>'; }
});
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => { document.querySelector('#trade').value = button.dataset.project; current = 0; render(false); document.querySelector('#quote').scrollIntoView({ behavior: 'smooth' }); }));
const privacy = document.querySelector('#privacy');
for (const id of ['privacy-open', 'footer-privacy']) document.getElementById(id).addEventListener('click', () => privacy.showModal());
document.querySelector('#privacy-close').addEventListener('click', () => privacy.close());
document.querySelector('#year').textContent = new Date().getFullYear();
