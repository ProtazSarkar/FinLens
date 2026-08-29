from datetime import datetime
import numpy as np

class DateProcessingEngine:
    def process(self, date_input):
        if not date_input:
            dt = datetime.utcnow()
        elif isinstance(date_input, str):
            try:
                dt = datetime.fromisoformat(date_input)
            except ValueError:
                dt = datetime.utcnow()
        else:
            dt = date_input
            
        hour = dt.hour
        day_of_week = dt.weekday()
        day_of_month = dt.day
        
        hour_sin = np.sin(2 * np.pi * hour / 24.0)
        hour_cos = np.cos(2 * np.pi * hour / 24.0)
        dow_sin = np.sin(2 * np.pi * day_of_week / 7.0)
        dow_cos = np.cos(2 * np.pi * day_of_week / 7.0)
        
        is_weekend = 1 if day_of_week >= 5 else 0
        is_night = 1 if (hour >= 23 or hour <= 5) else 0
        
        return {
            "hour_sin": hour_sin,
            "hour_cos": hour_cos,
            "dow_sin": dow_sin,
            "dow_cos": dow_cos,
            "day_of_month": day_of_month,
            "is_weekend": is_weekend,
            "is_night": is_night
        }

class LocationProcessingEngine:
    def process(self, raw_location):
        loc_clean = (raw_location or "").upper().strip()
        is_online = 1 if any(kw in loc_clean for kw in ["WWW.", "HTTP", ".COM", "ONLINE", "IN-APP"]) else 0
        is_atm = 1 if "ATM" in loc_clean else 0
        is_international = 1 if any(kw in loc_clean for kw in ["INTL", "FOREIGN", "FX"]) else 0
        tokens = [t.strip() for t in loc_clean.split(",") if t.strip()]
        has_city = 1 if len(tokens) >= 1 else 0
        
        return {
            "loc_is_online": is_online,
            "loc_is_atm": is_atm,
            "loc_is_international": is_international,
            "loc_has_known_city": has_city
        }

class PartyProcessingEngine:
    BUSINESS_KEYWORDS = ["INC", "LLC", "LTD", "CORP", "STORE", "PAY", "MART", "SERVICES", "SHOP", "PVT"]
    
    def process(self, sender_raw, receiver_raw):
        sender = (sender_raw or "").upper().strip()
        receiver = (receiver_raw or "").upper().strip()
        receiver_is_business = 1 if any(kw in receiver for kw in self.BUSINESS_KEYWORDS) else 0
        is_upi_handle = 1 if ("@" in sender or "@" in receiver) else 0
        is_same_party = 1 if (sender and sender == receiver) else 0
        
        return {
            "party_is_upi_handle": is_upi_handle,
            "receiver_is_business": receiver_is_business,
            "is_same_party": is_same_party,
            "sender_len": len(sender),
            "receiver_len": len(receiver)
        }

class PaymentMethodEngine:
    PAYMENT_MODES = ["UPI", "CARD", "NETBANKING", "WALLET", "CASH", "WIRE"]
    
    def process(self, raw_method, sender_str="", receiver_str="", location_str=""):
        method_clean = (raw_method or "").upper().strip()
        combined_text = f"{sender_str} {receiver_str} {location_str}".upper()
        
        if not method_clean:
            if "@" in combined_text or "UPI" in combined_text:
                method_clean = "UPI"
            elif any(kw in combined_text for kw in ["VISA", "MASTERCARD", "RUPAY", "AMEX", "CARD", "POS"]):
                method_clean = "CARD"
            elif any(kw in combined_text for kw in ["NEFT", "IMPS", "RTGS", "BANK", "ACH"]):
                method_clean = "WIRE"
            elif "ATM" in combined_text or "CASH" in combined_text:
                method_clean = "CASH"
            elif any(kw in combined_text for kw in ["PAYTM", "WALLET", "PAYPAL"]):
                method_clean = "WALLET"
            else:
                method_clean = "OTHER"
                
        is_credit_card = 1 if "CREDIT" in method_clean or "CREDIT" in combined_text else 0
        is_debit_card = 1 if "DEBIT" in method_clean or "DEBIT" in combined_text else 0
        
        features = {}
        for mode in self.PAYMENT_MODES:
            features[f"pm_is_{mode.lower()}"] = 1 if mode in method_clean else 0
            
        features["pm_is_credit"] = is_credit_card
        features["pm_is_debit"] = is_debit_card
        
        return features

class TransactionTransformer:
    def __init__(self):
        self.date_engine = DateProcessingEngine()
        self.loc_engine = LocationProcessingEngine()
        self.party_engine = PartyProcessingEngine()
        self.pm_engine = PaymentMethodEngine()

    def transform(self, raw_tx: dict):
        date_feats = self.date_engine.process(raw_tx.get("timestamp"))
        loc_feats = self.loc_engine.process(raw_tx.get("location"))
        party_feats = self.party_engine.process(raw_tx.get("sender"), raw_tx.get("receiver"))
        pm_feats = self.pm_engine.process(
            raw_method=raw_tx.get("payment_method"),
            sender_str=raw_tx.get("sender", ""),
            receiver_str=raw_tx.get("receiver", ""),
            location_str=raw_tx.get("location", "")
        )
        
        amount = float(raw_tx.get("amount", 0.0))
        
        feature_dict = {
            "amount": amount,
            **date_feats,
            **loc_feats,
            **party_feats,
            **pm_feats
        }
        
        return np.array(list(feature_dict.values()), dtype=np.float32), feature_dict