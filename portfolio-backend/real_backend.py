# FOR INDIAN STOCKS: Always use estimated FCF
if symbol.endswith(('.NS', '.BO')):
    final_fcf_per_share = estimated_fcf_per_share
    fcf_source = "estimated"
    fcf_note = f"EPS-based estimate ({sector}: {self.get_sector_multiplier_text(sector)})"
