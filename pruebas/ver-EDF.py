import mne

raw = mne.io.read_raw_edf("Ernesto_20250622-20250624.edf", preload=True)
raw.plot(block=True)
