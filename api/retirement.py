import json

def handler(request):
    # Parse JSON body
    data = json.loads(request.body)

    # Helper to parse numbers
    def num(k, pct=False):
        v = float(data.get(k, 0))
        return (v / 100) if pct else v

    # Unpack inputs
    age            = int(data["age"])
    full_age       = int(data["full_age"])
    income         = num("income")
    annual_raise   = num("annual_raise", pct=True)
    current_401k   = num("current_401k")
    contrib_pct    = num("contrib_pct", pct=True)
    current_ira    = num("current_ira")
    ira_contrib    = num("ira_contrib")
    return_rate    = num("return_rate", pct=True)
    other_monthly  = num("other_monthly")
    pension_month  = num("pension_month")
    ss_month       = num("ss_month")
    expense_month  = num("expense_month")
    inflation      = num("inflation", pct=True)
    wd_growth      = num("wd_growth", pct=True)
    retire_return  = num("retire_return", pct=True)
    wd_rate        = num("wd_rate", pct=True)
    years_retire   = int(data["years_retire"])

    # Project pre-retirement savings
    def project_savings():
        k, i, inc = current_401k, current_ira, income
        for _ in range(full_age - age):
            k = (k + inc * contrib_pct) * (1 + return_rate)
            i = (i + ira_contrib) * (1 + return_rate)
            inc *= (1 + annual_raise)
        return k + i

    total_savings = project_savings()
    init_withdraw = total_savings * wd_rate

    # Build amortization table
    table = []
    balance = total_savings
    prev_wd = None

    for year in range(1, years_retire + 1):
        age_cur = full_age + year - 1
        start_bal = balance
        exp_ann = expense_month * 12 * ((1 + inflation) ** (year - 1))

        wd = init_withdraw if year == 1 else prev_wd * (1 + wd_growth)
        prev_wd = wd

        other_ann = other_monthly * 12
        pension_ann = pension_month * 12
        ss_ann = ss_month * 12
        total_inc = wd + other_ann + pension_ann + ss_ann
        end_bal = (balance - wd) * (1 + retire_return)

        table.append({
            "year": year,
            "age": age_cur,
            "start": round(start_bal,2),
            "withdrawal": round(wd,2),
            "other": round(other_ann,2),
            "pension": round(pension_ann,2),
            "ss": round(ss_ann,2),
            "total_income": round(total_inc,2),
            "expenses": round(exp_ann,2),
            "end": round(end_bal,2)
        })
        balance = end_bal

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "total_savings": round(total_savings,2),
            "table": table
        })
    }
