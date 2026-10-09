<?php

namespace iEducar\Packages\PreMatricula\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property int $school_year_id
 * @property string $name
 * @property string $message_footer
 * @property string $grade_age_range_link
 * @property bool $active
 * @property SchoolYear $schoolYear
 * @property bool $forceSuggestedGrade
 * @property bool $showPriorityProtocol
 * @property bool $allowResponsibleSelectMapAddress
 * @property bool $selected_schools
 * @property int $waiting_list_limit
 * @property bool $one_per_year
 * @property bool $show_waiting_list
 * @property string $criteria
 * @property bool $priority_custom
 * @property int $reject_type_id
 * @property int $process_grouper_id
 * @property ProcessGrouper $grouper
 */
class Process extends Model
{
    const int NO_REJECT = 0;

    const int REJECT_SAME_PROCESS = 1;

    const int REJECT_SAME_YEAR = 2;

    /**
     * @var array
     */
    protected $fillable = [
        'school_year_id',
        'name',
        'message_footer',
        'grade_age_range_link',
        'active',
        'force_suggested_grade',
        'show_priority_protocol',
        'allow_responsible_select_map_address',
        'block_incompatible_age_group',
        'auto_reject_by_days',
        'auto_reject_days',
        'selected_schools',
        'waiting_list_limit',
        'minimum_age',
        'one_per_year',
        'show_waiting_list',
        'criteria',
        'priority_custom',
        'reject_type_id',
        'process_grouper_id',
    ];

    /**
     * @return BelongsTo
     */
    public function schoolYear()
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function grouper(): BelongsTo
    {
        return $this->belongsTo(ProcessGrouper::class, 'process_grouper_id');
    }

    public function periods()
    {
        return $this->belongsToMany(Period::class, 'process_period');
    }

    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'process_grade');
    }

    /**
     * @codeCoverageIgnore
     */
    public function gradesWithSuggestedAges()
    {
        return $this->hasMany(ProcessGradeSuggest::class);
    }

    public function schools()
    {
        return $this->belongsToMany(School::class, 'process_school');
    }

    public function schoolsSelected()
    {
        return $this->belongsToMany(School::class, 'process_school_selected');
    }

    public function getSchoolsAttribute(): Collection
    {
        // Se a relação já estiver carregada no modelo atual retorna ela
        if ($this->relationLoaded('schools')) {
            return $this->getRelationValue('schools');
        }

        // Obtém as escolas do cache ou busca no banco de dados e armazena em cache
        $schools = Cache::remember('process_' . $this->id . '_schools', now()->addHour(), function () {
            return $this->getRelationValue('schools');
        });

        // Seta os dados no modelo atual
        $this->setRelation('schools', $schools);

        return $schools;
    }

    public function stages()
    {
        return $this->hasMany(ProcessStage::class)->orderBy('start_at');
    }

    public function fields()
    {
        return $this->hasMany(ProcessField::class)->with('field');
    }

    /**
     * @codeCoverageIgnore
     */
    public function vacancies()
    {
        return $this->hasMany(ProcessVacancy::class);
    }

    public function preregistrations()
    {
        return $this->hasMany(PreRegistration::class);
    }

    /**
     * @codeCoverageIgnore
     */
    public function waitingPreregistrations()
    {
        return $this->hasMany(PreRegistration::class)->where('status', PreRegistration::STATUS_WAITING);
    }

    /**
     * @codeCoverageIgnore
     */
    public function acceptedPreregistrations()
    {
        return $this->hasMany(PreRegistration::class)->where('status', PreRegistration::STATUS_ACCEPTED);
    }

    /**
     * @codeCoverageIgnore
     */
    public function rejectedPreregistrations()
    {
        return $this->hasMany(PreRegistration::class)->where('status', PreRegistration::STATUS_REJECTED);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function shouldNotReject(): bool
    {
        return $this->reject_type_id === Process::NO_REJECT;
    }

    public function shouldRejectInSameProcess(): bool
    {
        return $this->reject_type_id === Process::REJECT_SAME_PROCESS;
    }

    public function shouldRejectInSameYear(): bool
    {
        return $this->reject_type_id === Process::REJECT_SAME_YEAR;
    }

    protected static function booted(): void
    {
        static::updated(function (Process $process) {
            Cache::forget('process_' . $process->id . '_schools');
        });
    }
}
